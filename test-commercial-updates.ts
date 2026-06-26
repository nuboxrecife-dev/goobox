import { dbHelper } from './src/lib/db';
import { GET as transactionsGet } from './src/app/api/transactions/route';
import { GET as ticketsGet, POST as ticketsPost } from './src/app/api/tickets/route';
import { GET as ticketDetailGet, POST as ticketDetailPost } from './src/app/api/tickets/[id]/route';
import { POST as recoverPost } from './src/app/api/auth/recover/route';
import { POST as resetPost } from './src/app/api/auth/reset/route';

async function runTests() {
  console.log('🧪 Iniciando testes das Atualizações Comerciais...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const testUserEmail = `test_commercial_${Math.floor(Math.random() * 100000)}@goobox.com`;
    console.log(`\n👤 Criando usuário de teste: ${testUserEmail}`);
    const user = await dbHelper.createUser({
      name: 'Test Commercial User',
      email: testUserEmail,
      passwordHash: 'dummy_hash',
      balance: 100.00
    });
    assert(!!user, 'Usuário de teste criado com sucesso.');

    // ----------------------------------------------------
    // TEST 1: Transactions API & logging
    // ----------------------------------------------------
    console.log('\n🧾 Testando Histórico de Transações (Extrato)...');
    await dbHelper.addTransaction({
      userEmail: testUserEmail,
      amount: 50.00,
      type: 'deposit',
      description: 'Depósito Pix de Teste'
    });

    const txRequest = new Request(`http://localhost/api/transactions?email=${encodeURIComponent(testUserEmail)}`);
    const txResponse = await transactionsGet(txRequest);
    const txData = await txResponse.json();
    assert(txResponse.status === 200, 'Endpoint /api/transactions retornou status 200.');
    assert(txData.length >= 1, 'Transação de depósito foi listada no extrato.');
    assert(txData[0].amount === 50.00 && txData[0].type === 'deposit', 'Campos da transação estão corretos.');

    // ----------------------------------------------------
    // TEST 2: Support Tickets API - Create Ticket
    // ----------------------------------------------------
    console.log('\n💬 Testando Sistema de Tickets (Criação)...');
    const ticketPostRequest = new Request('http://localhost/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        subject: 'Problema com saldo de teste',
        message: 'Meu depósito de R$ 50 não foi computado.'
      })
    });
    const ticketPostResponse = await ticketsPost(ticketPostRequest);
    const ticketPostData = await ticketPostResponse.json();
    assert(ticketPostResponse.status === 200, 'Endpoint POST /api/tickets retornou status 200.');
    assert(ticketPostData.success === true, 'Ticket criado com sucesso.');
    assert(!!ticketPostData.ticket?.id, 'ID do ticket gerado com sucesso.');

    const ticketId = ticketPostData.ticket.id;

    // ----------------------------------------------------
    // TEST 3: Support Tickets API - List Tickets
    // ----------------------------------------------------
    console.log('\n💬 Testando Sistema de Tickets (Listagem)...');
    const ticketListRequest = new Request(`http://localhost/api/tickets?email=${encodeURIComponent(testUserEmail)}`);
    const ticketListResponse = await ticketsGet(ticketListRequest);
    const ticketListData = await ticketListResponse.json();
    assert(ticketListResponse.status === 200, 'Endpoint GET /api/tickets retornou status 200.');
    assert(ticketListData.length >= 1, 'Ticket criado foi listado com sucesso.');
    assert(ticketListData[0].id === ticketId, 'ID do ticket retornado coincide.');

    // ----------------------------------------------------
    // TEST 4: Support Tickets API - Get Ticket Details & Messages
    // ----------------------------------------------------
    console.log('\n💬 Testando Sistema de Tickets (Detalhes e Mensagens)...');
    const ticketDetailContext = { params: Promise.resolve({ id: ticketId }) };
    const ticketDetailRequest = new Request(`http://localhost/api/tickets/${ticketId}?email=${encodeURIComponent(testUserEmail)}`);
    const ticketDetailResponse = await ticketDetailGet(ticketDetailRequest, ticketDetailContext);
    const ticketDetailData = await ticketDetailResponse.json();
    assert(ticketDetailResponse.status === 200, 'Endpoint GET /api/tickets/[id] retornou status 200.');
    assert(ticketDetailData.ticket.id === ticketId, 'Detalhes do ticket carregados com sucesso.');
    assert(ticketDetailData.messages.length === 1, 'Mensagem inicial do ticket incluída com sucesso.');

    // ----------------------------------------------------
    // TEST 5: Support Tickets API - Post Reply Message
    // ----------------------------------------------------
    console.log('\n💬 Testando Sistema de Tickets (Responder Chamado)...');
    const replyRequest = new Request(`http://localhost/api/tickets/${ticketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        message: 'Favor verificar com urgência!'
      })
    });
    const replyResponse = await ticketDetailPost(replyRequest, ticketDetailContext);
    const replyData = await replyResponse.json();
    assert(replyResponse.status === 200, 'Endpoint POST /api/tickets/[id] (Resposta) retornou status 200.');
    assert(replyData.success === true, 'Mensagem de resposta adicionada com sucesso.');

    // Refresh thread to check status and message count
    const updatedThreadResponse = await ticketDetailGet(ticketDetailRequest, ticketDetailContext);
    const updatedThreadData = await updatedThreadResponse.json();
    assert(updatedThreadData.messages.length === 2, 'Nova mensagem listada no histórico do chamado.');
    assert(updatedThreadData.ticket.status === 'aberto', 'Status do ticket continua aberto quando usuário responde.');

    // ----------------------------------------------------
    // TEST 6: Support Tickets API - Close Ticket
    // ----------------------------------------------------
    console.log('\n💬 Testando Sistema de Tickets (Fechar Chamado)...');
    const closeRequest = new Request(`http://localhost/api/tickets/${ticketId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        action: 'close'
      })
    });
    const closeResponse = await ticketDetailPost(closeRequest, ticketDetailContext);
    assert(closeResponse.status === 200, 'Endpoint POST /api/tickets/[id] (Encerrar) retornou status 200.');

    const closedThreadResponse = await ticketDetailGet(ticketDetailRequest, ticketDetailContext);
    const closedThreadData = await closedThreadResponse.json();
    assert(closedThreadData.ticket.status === 'fechado', 'Status do ticket atualizado para "fechado".');

    // ----------------------------------------------------
    // TEST 7: Password Recovery - Request Reset
    // ----------------------------------------------------
    console.log('\n🔑 Testando Recuperação de Senha (Solicitar)...');
    const recoverRequest = new Request('http://localhost/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUserEmail })
    });
    const recoverResponse = await recoverPost(recoverRequest);
    const recoverData = await recoverResponse.json();
    assert(recoverResponse.status === 200, 'Endpoint POST /api/auth/recover retornou status 200.');
    assert(recoverData.success === true, 'Pedido de recuperação aceito.');
    assert(!!recoverData.token, 'Token de recuperação retornado no payload de simulação.');

    const resetToken = recoverData.token;

    // ----------------------------------------------------
    // TEST 8: Password Recovery - Reset Password with Invalid Token
    // ----------------------------------------------------
    console.log('\n🔑 Testando Recuperação de Senha (Token Inválido)...');
    const invalidResetRequest = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid_token_12345',
        password: 'new_secure_password'
      })
    });
    const invalidResetResponse = await resetPost(invalidResetRequest);
    assert(invalidResetResponse.status === 400, 'Redefinição rejeitada com token inválido (status 400).');

    // ----------------------------------------------------
    // TEST 9: Password Recovery - Reset Password Success & Replay Protection
    // ----------------------------------------------------
    console.log('\n🔑 Testando Recuperação de Senha (Sucesso e Proteção Replay)...');
    const validResetRequest = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: 'new_secure_password'
      })
    });
    const validResetResponse = await resetPost(validResetRequest);
    const validResetData = await validResetResponse.json();
    assert(validResetResponse.status === 200, 'Redefinição de senha retornou status 200.');
    assert(validResetData.success === true, 'Senha redefinida com sucesso.');

    // Attempt replay attack (reuse token)
    const replayResetRequest = new Request('http://localhost/api/auth/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: 'new_secure_password'
      })
    });
    const replayResetResponse = await resetPost(replayResetRequest);
    assert(replayResetResponse.status === 400, 'Tentativa de reutilização do token bloqueada (status 400).');

    // Verify password verification works with new password
    const updatedUser = await dbHelper.getUserByEmail(testUserEmail);
    assert(!!updatedUser?.passwordHash, 'Usuário ainda possui password_hash.');
    
    // Clean up test user
    await dbHelper.deleteUser(testUserEmail);
    console.log(`\n👤 Limpando usuário de teste: ${testUserEmail}`);

  } catch (err) {
    console.error('❌ Erro inesperado durante execução dos testes:', err);
    failed++;
  }

  console.log(`\n📊 Resumo dos testes: ${passed} Passaram, ${failed} Falharam.`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
