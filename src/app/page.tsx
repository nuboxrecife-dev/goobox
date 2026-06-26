'use client';

import { useState, useEffect } from 'react';

type Tab = 'novo-pedido' | 'servicos' | 'adicionar-saldo' | 'pedidos' | 'extrato' | 'suporte' | 'api' | 'admin' | 'perfil';
type AuthScreen = 'login' | 'register' | 'forgot' | 'reset';

interface Transaction {
  id: string;
  userEmail: string;
  amount: number;
  type: 'deposit' | 'order' | 'refund' | 'bonus';
  description: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  userEmail: string;
  subject: string;
  message: string;
  status: 'aberto' | 'respondido' | 'fechado';
  createdAt: string;
}

interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'admin';
  message: string;
  createdAt: string;
}

interface UserStats {
  name: string;
  email: string;
  balance: number;
  totalOrders: number;
  totalSpent: number;
  status: string;
  role?: string;
}

interface Service {
  id: string;
  name: string;
  category: string;
  ratePer1000: number;
  min: number;
  max: number;
  description: string;
}

interface Order {
  id: string;
  serviceId: string;
  serviceName: string;
  link: string;
  quantity: number;
  charge: number;
  status: 'Pendente' | 'Processando' | 'Concluido' | 'Cancelado' | 'Parcial';
  createdAt: string;
  userEmail?: string;
}

interface Payment {
  id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  qrCodeBase64: string;
  qrCode: string;
  createdAt: string;
}

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minDeposit: number;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  createdAt?: string;
}

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  
  // Auth Form inputs
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);

  // Password Recovery / Reset inputs
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Form states for change password (profile)
  const [changePasswordCurrent, setChangePasswordCurrent] = useState('');
  const [changePasswordNew, setChangePasswordNew] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordFeedback, setChangePasswordFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>('novo-pedido');
  const [user, setUser] = useState<UserStats | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for New Order
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [orderLink, setOrderLink] = useState('');
  const [orderQuantity, setOrderQuantity] = useState(100);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFeedback, setOrderFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Form states for Pix deposit
  const [depositAmount, setDepositAmount] = useState('15.00');
  const [generatedPix, setGeneratedPix] = useState<Payment | null>(null);
  const [pixLoading, setPixLoading] = useState(false);
  const [pixFeedback, setPixFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Admin Panel states
  const [adminUsers, setAdminUsers] = useState<UserStats[]>([]);
  const [markupPercent, setMarkupPercent] = useState<number>(20);
  const [whatsappNumber, setWhatsappNumber] = useState<string>('5511999999999');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success'>('info');
  const [adminTab, setAdminTab] = useState<'geral' | 'usuarios' | 'servicos' | 'pedidos' | 'cupons' | 'suporte'>('geral');
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrdersSearch, setAdminOrdersSearch] = useState('');
  const [adminOrdersStatusFilter, setAdminOrdersStatusFilter] = useState('');
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [adjustingUserEmail, setAdjustingUserEmail] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('10.00');
  const [isAdjustingBalance, setIsAdjustingBalance] = useState(false);
  const [isSavingMarkup, setIsSavingMarkup] = useState(false);

  const [adminMetrics, setAdminMetrics] = useState<{
    totalBilling: number;
    dailyBilling: number;
    weeklyBilling: number;
    monthlyBilling: number;
    estimatedProfit: number;
    totalOrders: number;
    totalUsers: number;
  } | null>(null);

  // Form states for creating a user
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createBalance, setCreateBalance] = useState('0.00');
  const [createRole, setCreateRole] = useState('user');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Service management states
  const [adminServiceSearch, setAdminServiceSearch] = useState('');
  const [adminServiceCategoryFilter, setAdminServiceCategoryFilter] = useState('');
  const [isSyncingServices, setIsSyncingServices] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [serviceModalMode, setServiceModalMode] = useState<'create' | 'edit'>('create');
  const [serviceFormId, setServiceFormId] = useState('');
  const [serviceFormName, setServiceFormName] = useState('');
  const [serviceFormCategory, setServiceFormCategory] = useState('');
  const [serviceFormRate, setServiceFormRate] = useState('');
  const [serviceFormMin, setServiceFormMin] = useState('10');
  const [serviceFormMax, setServiceFormMax] = useState('10000');
  const [serviceFormDescription, setServiceFormDescription] = useState('');
  const [isSavingService, setIsSavingService] = useState(false);

  // Coupons management and usage states
  const [adminCoupons, setAdminCoupons] = useState<Coupon[]>([]);
  const [adminCouponsLoading, setAdminCouponsLoading] = useState(false);
  const [createCouponCode, setCreateCouponCode] = useState('');
  const [createCouponType, setCreateCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [createCouponValue, setCreateCouponValue] = useState('');
  const [createCouponMinDeposit, setCreateCouponMinDeposit] = useState('0.00');
  const [createCouponMaxUses, setCreateCouponMaxUses] = useState('');
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  // User coupons states
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [directCouponInput, setDirectCouponInput] = useState('');
  const [directCouponFeedback, setDirectCouponFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isRedeemingDirect, setIsRedeemingDirect] = useState(false);
  const [refillLoading, setRefillLoading] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedTicketMessages, setSelectedTicketMessages] = useState<TicketMessage[]>([]);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketReply, setTicketReply] = useState('');
  const [supportFeedback, setSupportFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Check auth session
  useEffect(() => {
    const savedSession = sessionStorage.getItem('goobox_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Erro ao ler sessao:', err);
      }
    }
    setLoading(false);
  }, []);

  // Read reset token from URL query params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      if (token) {
        setResetToken(token);
        setAuthScreen('reset');
      }
    }
  }, []);

  // Fetch initial SMM data after auth
  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      const sessionUserStr = sessionStorage.getItem('goobox_session');
      const sessionUser = sessionUserStr ? JSON.parse(sessionUserStr) : null;
      const emailParam = sessionUser?.email ? `?email=${encodeURIComponent(sessionUser.email)}` : '';

      const [userRes, servicesRes, ordersRes, paymentsRes, settingsRes, transactionsRes, ticketsRes] = await Promise.all([
        fetch(`/api/user${emailParam}`),
        fetch('/api/services'),
        fetch(`/api/orders${emailParam}`),
        fetch(`/api/payment${emailParam}`),
        fetch('/api/admin/settings'),
        fetch(`/api/transactions${emailParam}`),
        fetch(`/api/tickets${emailParam}`).catch(() => null)
      ]);

      const userData = await userRes.json();
      const servicesData = await servicesRes.json();
      const ordersData = await ordersRes.json();
      const paymentsData = await paymentsRes.json();
      const settingsData = await settingsRes.json();
      const transactionsData = await transactionsRes.json();
      const ticketsData = ticketsRes && ticketsRes.ok ? await ticketsRes.json() : [];

      // Merge current active session details if customized
      if (sessionUser) {
        const mergedUser = {
          ...userData,
          name: sessionUser.name,
          email: sessionUser.email,
          balance: userData.balance, // Use real balance from the database as source of truth
          role: sessionUser.role || userData.role || 'user'
        };
        sessionStorage.setItem('goobox_session', JSON.stringify(mergedUser));
        setUser(mergedUser);
      } else {
        setUser(userData);
      }
      
      setServices(servicesData);
      setOrders(ordersData);
      setPayments(paymentsData || []);
      setTransactions(transactionsData || []);
      setTickets(ticketsData || []);
      if (settingsData && settingsData.supportWhatsappNumber) {
        setWhatsappNumber(settingsData.supportWhatsappNumber);
      }
      if (settingsData && settingsData.serviceMarkupPercent !== undefined) {
        setMarkupPercent(settingsData.serviceMarkupPercent);
      }
      if (settingsData && settingsData.announcementText !== undefined) {
        setAnnouncementText(settingsData.announcementText);
      }
      if (settingsData && settingsData.announcementType !== undefined) {
        setAnnouncementType(settingsData.announcementType);
      }

      if (servicesData.length > 0) {
        const categories = Array.from(new Set(servicesData.map((s: Service) => s.category))) as string[];
        setSelectedCategory(categories[0] || '');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  // Pure JS confetti celebration effect
  const triggerConfetti = () => {
    const colors = ['#6c25e2', '#00bfa5', '#ff3366', '#ffeb3b', '#2196f3'];
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '99999';
    document.body.appendChild(container);

    for (let i = 0; i < 100; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = `${Math.random() * 8 + 6}px`;
      particle.style.height = `${Math.random() * 15 + 8}px`;
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.top = '-20px';
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.borderRadius = '2px';
      particle.style.opacity = (Math.random() * 0.5 + 0.5).toString();
      
      const duration = Math.random() * 3 + 2;
      const delay = Math.random() * 1.5;
      
      particle.style.transition = `transform ${duration}s linear ${delay}s, opacity ${duration}s linear ${delay}s`;
      container.appendChild(particle);

      requestAnimationFrame(() => {
        setTimeout(() => {
          particle.style.transform = `translate(${Math.random() * 200 - 100}px, 105vh) rotate(${Math.random() * 720}deg)`;
          particle.style.opacity = '0';
        }, 100);
      });
    }

    setTimeout(() => {
      container.remove();
    }, 5000);
  };

  // Real-time polling for pending Pix payments status
  useEffect(() => {
    if (!generatedPix || generatedPix.status !== 'pending' || !user) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const paymentsList: Payment[] = await res.json();
          const currentPayment = paymentsList.find(p => p.id === generatedPix.id);
          if (currentPayment && currentPayment.status === 'approved') {
            setGeneratedPix(currentPayment);
            await fetchData();
            triggerConfetti();
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status do Pix:', err);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [generatedPix, user]);

  const fetchAdminData = async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    setAdminLoading(true);
    setAdminCouponsLoading(true);
    try {
      const [usersRes, settingsRes, metricsRes, couponsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/settings'),
        fetch('/api/admin/metrics'),
        fetch('/api/admin/coupons'),
        fetch('/api/admin/orders').catch(() => null)
      ]);
      if (usersRes.ok && settingsRes.ok && metricsRes.ok && couponsRes.ok) {
        const usersData = await usersRes.json();
        const settingsData = await settingsRes.json();
        const metricsData = await metricsRes.json();
        const couponsData = await couponsRes.json();
        const ordersData = ordersRes && ordersRes.ok ? await ordersRes.json() : [];
        setAdminUsers(usersData);
        setMarkupPercent(settingsData.serviceMarkupPercent);
        setAdminMetrics(metricsData);
        setAdminCoupons(couponsData);
        setAdminOrders(ordersData || []);
        if (settingsData.supportWhatsappNumber) {
          setWhatsappNumber(settingsData.supportWhatsappNumber);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do admin:', err);
    } finally {
      setAdminLoading(false);
      setAdminCouponsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' && user?.role === 'admin') {
      fetchAdminData();
    }
  }, [activeTab, user]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    setIsSavingMarkup(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          serviceMarkupPercent: markupPercent,
          supportWhatsappNumber: whatsappNumber,
          announcementText,
          announcementType
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: 'Configurações atualizadas com sucesso!' });
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao atualizar configurações.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão.' });
    } finally {
      setIsSavingMarkup(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    if (!adjustingUserEmail) return;
    setIsAdjustingBalance(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adjustingUserEmail, amount: parseFloat(adjustmentAmount) })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: data.message || 'Saldo atualizado com sucesso!' });
        setAdjustmentAmount('10.00');
        fetchAdminData();
        if (user && adjustingUserEmail.toLowerCase() === user.email.toLowerCase()) {
          const updatedUser = { ...user, balance: user.balance + parseFloat(adjustmentAmount) };
          sessionStorage.setItem('goobox_session', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao atualizar saldo.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão.' });
    } finally {
      setIsAdjustingBalance(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: createName,
          email: createEmail,
          password: createPassword,
          balance: parseFloat(createBalance) || 0,
          role: createRole
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: `Usuário ${createName} criado com sucesso!` });
        setCreateName('');
        setCreateEmail('');
        setCreatePassword('');
        setCreateBalance('0.00');
        setCreateRole('user');
        fetchAdminData();
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao criar usuário.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão ao criar usuário.' });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (email.toLowerCase() === 'admin@goobox.com') {
      alert('Não é possível excluir o administrador principal.');
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir permanentemente o usuário ${email}?`)) {
      return;
    }
    
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          email
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: 'Usuário excluído com sucesso!' });
        fetchAdminData();
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao excluir usuário.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de rede ao excluir usuário.' });
    }
  };

  const handleOpenServiceModal = (mode: 'create' | 'edit', service?: Service) => {
    setServiceFormId(service?.id || '');
    setServiceFormName(service?.name || '');
    setServiceFormCategory(service?.category || '');
    setServiceFormRate(service?.ratePer1000?.toString() || '');
    setServiceFormMin(service?.min?.toString() || '10');
    setServiceFormMax(service?.max?.toString() || '10000');
    setServiceFormDescription(service?.description || '');
    setServiceModalMode(mode);
    setServiceModalOpen(true);
  };

  const handleServiceFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    setIsSavingService(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: serviceModalMode,
          id: serviceFormId,
          name: serviceFormName,
          category: serviceFormCategory,
          ratePer1000: parseFloat(serviceFormRate) || 0,
          min: parseInt(serviceFormMin) || 0,
          max: parseInt(serviceFormMax) || 0,
          description: serviceFormDescription
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: data.message || 'Serviço salvo com sucesso!' });
        setServiceModalOpen(false);
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao salvar serviço.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão ao salvar serviço.' });
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o serviço de ID ${id}?`)) {
      return;
    }
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          id
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: 'Serviço excluído com sucesso!' });
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao excluir serviço.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão ao excluir serviço.' });
    }
  };

  const handleSyncServices = async () => {
    setAdminFeedback(null);
    setIsSyncingServices(true);
    try {
      const res = await fetch('/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: data.message || 'Serviços sincronizados com sucesso!' });
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao sincronizar serviços.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão ao sincronizar serviços.' });
    } finally {
      setIsSyncingServices(false);
    }
  };

  const filteredAdminServices = services.filter(srv => {
    const matchesSearch = srv.id.toLowerCase().includes(adminServiceSearch.toLowerCase()) || 
                          srv.name.toLowerCase().includes(adminServiceSearch.toLowerCase()) ||
                          srv.category.toLowerCase().includes(adminServiceSearch.toLowerCase());
    const matchesCategory = adminServiceCategoryFilter ? srv.category === adminServiceCategoryFilter : true;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Poll for payments list when generatedPix is pending
  useEffect(() => {
    if (!generatedPix || generatedPix.status !== 'pending' || !isAuthenticated) return;

    const interval = setInterval(() => {
      fetchData();
    }, 4000);

    return () => clearInterval(interval);
  }, [generatedPix, isAuthenticated]);

  // Auto-approve generatedPix banner when payment status updates to approved in list
  useEffect(() => {
    if (generatedPix && generatedPix.status === 'pending') {
      const foundPayment = payments.find((p: any) => p.id === generatedPix.id);
      if (foundPayment && foundPayment.status === 'approved') {
        setGeneratedPix(foundPayment);
        setPixFeedback({ success: true, message: 'Pagamento aprovado e creditado!' });
      }
    }
  }, [payments, generatedPix]);

  // Update selected service when category or search changes
  useEffect(() => {
    if (services.length > 0 && selectedCategory) {
      const filtered = services.filter(s => s.category === selectedCategory);
      if (filtered.length > 0) {
        setSelectedServiceId(filtered[0].id);
      }
    }
  }, [selectedCategory, services]);

  // Calculate order price in real-time
  useEffect(() => {
    const service = services.find(s => s.id === selectedServiceId);
    if (service) {
      const price = (service.ratePer1000 / 1000) * orderQuantity;
      setCalculatedPrice(price);
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedServiceId, orderQuantity, services]);

  // Load ticket thread when ID is selected
  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketThread(selectedTicketId);
    }
  }, [selectedTicketId]);

  // Handle Auth actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);

    if (!authEmail || !authPassword) {
      setAuthFeedback('Preencha todos os campos obrigatórios.');
      return;
    }

    if (authScreen === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setAuthFeedback(data.error || 'Erro ao realizar login.');
          return;
        }

        sessionStorage.setItem('goobox_session', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error(err);
        setAuthFeedback('Erro de conexão ao realizar login.');
      }
    } else {
      if (!authName) {
        setAuthFeedback('Por favor, informe seu nome completo.');
        return;
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: authName, email: authEmail, password: authPassword })
        });
        const data = await res.json();

        if (!res.ok) {
          setAuthFeedback(data.error || 'Erro ao criar conta.');
          return;
        }

        sessionStorage.setItem('goobox_session', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        console.error(err);
        setAuthFeedback('Erro de conexão ao criar conta.');
      }
    }
  };

  const handleRecoverPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);
    if (!recoveryEmail) {
      setAuthFeedback('Preencha o e-mail de recuperação.');
      return;
    }
    try {
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthFeedback(data.error || 'Erro ao solicitar recuperação.');
      } else {
        // Clean input
        setRecoveryEmail('');
        // Local simulation support: if token is returned, let user click a link directly
        if (data.simulatedLink) {
          console.log('Simulated link:', data.simulatedLink);
          setAuthFeedback(`${data.message} Link de teste: ${data.simulatedLink}`);
        } else {
          setAuthFeedback(data.message);
        }
      }
    } catch (err) {
      console.error(err);
      setAuthFeedback('Erro ao conectar ao servidor de recuperação.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);
    if (!newPassword || !confirmPassword) {
      setAuthFeedback('Preencha todos os campos da senha.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthFeedback('As senhas digitadas não conferem.');
      return;
    }
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthFeedback(data.error || 'Erro ao redefinir a senha.');
      } else {
        setAuthFeedback(data.message);
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
        // Redirect back to login screen in 3 seconds
        setTimeout(() => {
          setAuthScreen('login');
          setAuthFeedback(null);
        }, 3000);
      }
    } catch (err) {
      console.error(err);
      setAuthFeedback('Erro de conexão ao redefinir a senha.');
    }
  };

  const handleLogoClick = async () => {
    setActiveTab('novo-pedido');
    await fetchData();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (changePasswordNew !== changePasswordConfirm) {
      setChangePasswordFeedback({ success: false, message: 'A nova senha e a confirmação não conferem.' });
      return;
    }
    if (changePasswordNew.length < 6) {
      setChangePasswordFeedback({ success: false, message: 'A nova senha deve ter no mínimo 6 caracteres.' });
      return;
    }

    setChangePasswordLoading(true);
    setChangePasswordFeedback(null);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          currentPassword: changePasswordCurrent,
          newPassword: changePasswordNew
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setChangePasswordFeedback({ success: true, message: data.message });
        setChangePasswordCurrent('');
        setChangePasswordNew('');
        setChangePasswordConfirm('');
      } else {
        setChangePasswordFeedback({ success: false, message: data.error || 'Erro ao alterar a senha.' });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setChangePasswordFeedback({ success: false, message: 'Erro de conexão ao alterar a senha.' });
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('goobox_session');
    setIsAuthenticated(false);
    setUser(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthName('');
  };

  const fetchTicketThread = async (id: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/tickets/${id}?email=${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTicketMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens do ticket:', err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !ticketSubject || !ticketMessage) return;
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          subject: ticketSubject,
          message: ticketMessage
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTicketSubject('');
        setTicketMessage('');
        // Refresh tickets
        fetchData();
        // Automatically open the new ticket
        if (data.ticket) {
          setSelectedTicketId(data.ticket.id);
          setSelectedTicketMessages([
            {
              id: Math.random().toString(),
              ticketId: data.ticket.id,
              sender: 'user',
              message: ticketMessage,
              createdAt: new Date().toISOString()
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Erro ao criar ticket:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTicketId || !ticketReply) return;
    try {
      const res = await fetch(`/api/tickets/${selectedTicketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          message: ticketReply
        })
      });
      if (res.ok) {
        setTicketReply('');
        fetchTicketThread(selectedTicketId);
        // Refresh ticket status in list
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao responder ticket:', err);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!user) return;
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          action: 'close'
        })
      });
      if (res.ok) {
        fetchTicketThread(ticketId);
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao fechar ticket:', err);
    }
  };

  // Handle placing order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);

    if (!selectedServiceId || !orderLink || !orderQuantity) {
      setOrderFeedback({ success: false, message: 'Por favor, preencha todos os campos.' });
      return;
    }

    if (!user) return;

    if (user.balance < calculatedPrice) {
      setOrderFeedback({ success: false, message: 'Saldo insuficiente. Adicione saldo para continuar.' });
      return;
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: selectedServiceId,
          link: orderLink,
          quantity: orderQuantity,
          userEmail: user?.email
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setOrderFeedback({ success: false, message: data.error || 'Erro ao processar o pedido.' });
        return;
      }

      // Update session storage balance
      const newBalance = user.balance - calculatedPrice;
      const updatedUser: UserStats = {
        ...user,
        balance: newBalance,
        totalOrders: user.totalOrders + 1,
        totalSpent: user.totalSpent + calculatedPrice
      };
      sessionStorage.setItem('goobox_session', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setOrderFeedback({ success: true, message: 'Pedido realizado com sucesso!' });
      setOrderLink('');
      fetchData();
    } catch (err) {
      console.error(err);
      setOrderFeedback({ success: false, message: 'Ocorreu um erro de rede. Tente novamente.' });
    }
  };

  // Handle generating PIX recharge
  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setPixFeedback(null);
    setGeneratedPix(null);
    setPixLoading(true);

    const amountNum = parseFloat(depositAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPixFeedback({ success: false, message: 'Insira um valor de depósito válido.' });
      setPixLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/payment/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: amountNum, 
          userEmail: user?.email,
          couponCode: appliedCoupon ? appliedCoupon.code : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setPixFeedback({ success: false, message: data.error || 'Erro ao gerar Pix.' });
        return;
      }

      setGeneratedPix(data.payment);
      fetchData();
    } catch (err) {
      console.error(err);
      setPixFeedback({ success: false, message: 'Erro de conexão ao gerar pagamento.' });
    } finally {
      setPixLoading(false);
    }
  };

  // Simulate Mercado Pago webhook confirmation
  const handleSimulateWebhook = async () => {
    if (!generatedPix || !user) return;
    try {
      const res = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: generatedPix.id,
          simulate: true
        })
      });

      if (res.ok) {
        setGeneratedPix(prev => prev ? { ...prev, status: 'approved' } : null);
        setPixFeedback({ success: true, message: 'Pagamento aprovado via simulação de webhook!' });
        
        // Add balance to current frontend session (including coupon bonus if any)
        let finalAmount = generatedPix.amount;
        if (appliedCoupon) {
          if (appliedCoupon.type === 'percentage') {
            finalAmount += parseFloat((generatedPix.amount * (appliedCoupon.value / 100)).toFixed(2));
          } else {
            finalAmount += appliedCoupon.value;
          }
          setAppliedCoupon(null);
          setCouponCodeInput('');
          setCouponFeedback(null);
        }
        
        const newBalance = user.balance + finalAmount;
        const updatedUser = { ...user, balance: newBalance };
        sessionStorage.setItem('goobox_session', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        fetchData();
      } else {
        const data = await res.json();
        setPixFeedback({ success: false, message: data.error || 'Erro na simulação.' });
      }
    } catch (err) {
      console.error(err);
      setPixFeedback({ success: false, message: 'Erro de rede na simulação.' });
    }
  };

  // Coupons Client Actions
  const handleApplyCoupon = async () => {
    if (!couponCodeInput || !user) return;
    setCouponFeedback(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCodeInput.toUpperCase(),
          email: user.email,
          depositAmount: parseFloat(depositAmount) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponFeedback({ success: false, message: data.error || 'Erro ao aplicar cupom.' });
        setAppliedCoupon(null);
      } else {
        setAppliedCoupon(data.coupon);
        const bonusValue = data.coupon.type === 'percentage' 
          ? `${data.coupon.value}%` 
          : `R$ ${data.coupon.value.toFixed(2)}`;
        setCouponFeedback({ 
          success: true, 
          message: `Cupom ${data.coupon.code} aplicado! Bônus: ${bonusValue}.` 
        });
      }
    } catch (err) {
      console.error(err);
      setCouponFeedback({ success: false, message: 'Erro de conexão ao aplicar cupom.' });
      setAppliedCoupon(null);
    }
  };

  const handleRedeemDirectCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directCouponInput || !user) return;
    setIsRedeemingDirect(true);
    setDirectCouponFeedback(null);
    try {
      const res = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: directCouponInput.toUpperCase(),
          email: user.email
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setDirectCouponFeedback({ success: false, message: data.error || 'Erro ao resgatar cupom.' });
      } else {
        setDirectCouponFeedback({ success: true, message: data.message });
        setDirectCouponInput('');
        
        // Update user stats
        const updatedUser: UserStats = {
          ...user,
          balance: data.newBalance
        };
        sessionStorage.setItem('goobox_session', JSON.stringify(updatedUser));
        setUser(updatedUser);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setDirectCouponFeedback({ success: false, message: 'Erro de conexão ao resgatar cupom.' });
    } finally {
      setIsRedeemingDirect(false);
    }
  };

  // Coupons Admin Actions
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminFeedback(null);
    setIsCreatingCoupon(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          code: createCouponCode.toUpperCase(),
          type: createCouponType,
          value: parseFloat(createCouponValue),
          minDeposit: parseFloat(createCouponMinDeposit),
          maxUses: createCouponMaxUses ? parseInt(createCouponMaxUses) : null
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao criar cupom.' });
      } else {
        setAdminFeedback({ success: true, message: data.message });
        setCreateCouponCode('');
        setCreateCouponValue('');
        setCreateCouponMinDeposit('0.00');
        setCreateCouponMaxUses('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão ao criar cupom.' });
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cupom ${code}?`)) return;
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          code: code
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao excluir cupom.' });
      } else {
        setAdminFeedback({ success: true, message: data.message });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão ao excluir cupom.' });
    }
  };

  const handleRequestRefill = async (orderId: string) => {
    if (!user) return;
    
    if (!confirm('Deseja solicitar a reposição (refil) para este pedido?')) {
      return;
    }

    setRefillLoading(orderId);
    try {
      const res = await fetch('/api/orders/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, userEmail: user.email })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erro ao solicitar a reposição.');
      } else {
        alert(data.message || 'Reposição solicitada com sucesso!');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao solicitar a reposição.');
    } finally {
      setRefillLoading(null);
    }
  };

  const handleAdminOrderAction = async (orderId: string, action: 'update_status' | 'refund', status?: string) => {
    if (action === 'refund') {
      if (!confirm('Deseja realmente cancelar este pedido e reembolsar o valor cobrado na conta do cliente?')) {
        return;
      }
    }

    setAdminOrdersLoading(true);
    setAdminFeedback(null);
    try {
      const res = await fetch('/api/admin/orders/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, orderId, status })
      });
      const data = await res.json();
      if (res.ok) {
        setAdminFeedback({ success: true, message: data.message || 'Operação realizada com sucesso!' });
        fetchAdminData();
        fetchData();
      } else {
        setAdminFeedback({ success: false, message: data.error || 'Erro ao realizar operação.' });
      }
    } catch (err) {
      console.error(err);
      setAdminFeedback({ success: false, message: 'Erro de conexão.' });
    } finally {
      setAdminOrdersLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const categories = Array.from(new Set(services.map(s => s.category)));

  const filteredServicesList = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
        <p style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600 }}>Carregando Goobox...</p>
      </div>
    );
  }

  // Render Login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="login-screen">
        <div className="login-glow-1"></div>
        <div className="login-glow-2"></div>
        <div className="login-glow-3"></div>
        
        <div className="login-card-wrapper">
          <div className="login-card">
            <div className="login-logo-container">
              <div className="login-logo-circle">
                {/* Box Logo SVG */}
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
                  <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <span className="login-logo-text">Goobox</span>
              <p className="login-subtitle">
                {authScreen === 'login' && 'Impulsione sua presença digital com o painel SMM do futuro.'}
                {authScreen === 'register' && 'Crie sua conta em segundos para começar a impulsionar suas redes sociais!'}
                {authScreen === 'forgot' && 'Informe seu e-mail cadastrado para enviarmos instruções de recuperação.'}
                {authScreen === 'reset' && 'Defina sua nova senha de acesso ao painel.'}
              </p>
            </div>

            {authFeedback && (
              <div className="payment-status-banner pending" style={{ marginBottom: '20px', fontSize: '13px', justifyContent: 'center' }}>
                ⚠️ {authFeedback}
              </div>
            )}

            {authScreen === 'forgot' ? (
              <form onSubmit={handleRecoverPassword} autoComplete="off">
                <div className="login-input-group">
                  <label className="form-label">E-mail cadastrado</label>
                  <input
                    type="email"
                    className="login-input-field"
                    placeholder="exemplo@goobox.com"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>
                <button type="submit" className="login-btn-premium">
                  Enviar Link de Recuperação
                </button>
              </form>
            ) : authScreen === 'reset' ? (
              <form onSubmit={handleResetPassword} autoComplete="off">
                <div className="login-input-group">
                  <label className="form-label">Nova Senha</label>
                  <input
                    type="password"
                    className="login-input-field"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <div className="login-input-group">
                  <label className="form-label">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    className="login-input-field"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
                <button type="submit" className="login-btn-premium">
                  Definir Nova Senha
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuthSubmit} autoComplete="off">
                {authScreen === 'register' && (
                  <div className="login-input-group">
                    <label className="form-label">Nome Completo</label>
                    <input
                      type="text"
                      className="login-input-field"
                      placeholder="Seu nome completo"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      required
                      autoComplete="off"
                    />
                  </div>
                )}

                <div className="login-input-group">
                  <label className="form-label">E-mail corporativo</label>
                  <input
                    type="email"
                    className="login-input-field"
                    placeholder="exemplo@goobox.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </div>

                <div className="login-input-group">
                  <label className="form-label">Senha de acesso</label>
                  <input
                    type="password"
                    className="login-input-field"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  {authScreen === 'login' && (
                    <span className="login-toggle-link" style={{ display: 'block', textAlign: 'right', marginTop: '6px', fontSize: '12px' }} onClick={() => { setAuthScreen('forgot'); setAuthFeedback(null); }}>
                      Esqueci minha senha
                    </span>
                  )}
                </div>

                <button type="submit" className="login-btn-premium">
                  {authScreen === 'login' ? 'Entrar no Dashboard' : 'Começar Agora - Grátis'}
                </button>
              </form>
            )}

            <div className="login-toggle">
              {authScreen === 'login' ? (
                <>
                  Novo na Goobox? 
                  <span className="login-toggle-link" onClick={() => { setAuthScreen('register'); setAuthFeedback(null); }}>
                    Crie sua conta
                  </span>
                </>
              ) : authScreen === 'register' ? (
                <>
                  Já tem cadastro? 
                  <span className="login-toggle-link" onClick={() => { setAuthScreen('login'); setAuthFeedback(null); }}>
                    Entrar
                  </span>
                </>
              ) : (
                <span className="login-toggle-link" onClick={() => { setAuthScreen('login'); setAuthFeedback(null); }}>
                  Voltar para o Login
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        <div className={`mobile-nav-item ${activeTab === 'novo-pedido' ? 'active' : ''}`} onClick={() => setActiveTab('novo-pedido')}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect width="7" height="9" x="3" y="3" rx="1"/>
            <rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/>
            <rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
          <span>Novo Pedido</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'servicos' ? 'active' : ''}`} onClick={() => setActiveTab('servicos')}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span>Serviços</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'adicionar-saldo' ? 'active' : ''}`} onClick={() => { setActiveTab('adicionar-saldo'); setGeneratedPix(null); setPixFeedback(null); }}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect width="20" height="14" x="2" y="5" rx="2"/>
            <line x1="2" x2="22" y1="10" y2="10"/>
          </svg>
          <span>Saldo</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'pedidos' ? 'active' : ''}`} onClick={() => setActiveTab('pedidos')}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
          </svg>
          <span>Pedidos</span>
        </div>
        <div className={`mobile-nav-item ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
          <span>API</span>
        </div>
        {user?.role === 'admin' && (
          <div className={`mobile-nav-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            <span>Admin</span>
          </div>
        )}
      </nav>

      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo-section" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            {/* Box SVG logo */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6c25e2' }}>
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span className="logo-text">Goobox</span>
          </div>

          <ul className="menu-list">
            <li className={`menu-item ${activeTab === 'novo-pedido' ? 'active' : ''}`} onClick={() => setActiveTab('novo-pedido')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect width="7" height="9" x="3" y="3" rx="1"/>
                <rect width="7" height="5" x="14" y="3" rx="1"/>
                <rect width="7" height="9" x="14" y="12" rx="1"/>
                <rect width="7" height="5" x="3" y="16" rx="1"/>
              </svg>
              <span>Novo Pedido</span>
            </li>
            <li className={`menu-item ${activeTab === 'servicos' ? 'active' : ''}`} onClick={() => setActiveTab('servicos')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span>Serviços</span>
            </li>
            <li className={`menu-item ${activeTab === 'adicionar-saldo' ? 'active' : ''}`} onClick={() => { setActiveTab('adicionar-saldo'); setGeneratedPix(null); setPixFeedback(null); }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect width="20" height="14" x="2" y="5" rx="2"/>
                <line x1="2" x2="22" y1="10" y2="10"/>
              </svg>
              <span>Adicionar Saldo</span>
            </li>
            <li className={`menu-item ${activeTab === 'pedidos' ? 'active' : ''}`} onClick={() => setActiveTab('pedidos')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
              </svg>
              <span>Pedidos</span>
            </li>
            <li className={`menu-item ${activeTab === 'extrato' ? 'active' : ''}`} onClick={() => setActiveTab('extrato')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Extrato</span>
            </li>
            <li className={`menu-item ${activeTab === 'suporte' ? 'active' : ''}`} onClick={() => setActiveTab('suporte')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Suporte</span>
            </li>
            <li className={`menu-item ${activeTab === 'api' ? 'active' : ''}`} onClick={() => setActiveTab('api')}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
              </svg>
              <span>API Integração</span>
            </li>
            {user?.role === 'admin' && (
              <li className={`menu-item ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                <span>Administrador</span>
              </li>
            )}
          </ul>
        </div>

        <div className="whatsapp-float" title="Suporte WhatsApp" onClick={() => window.open(`https://wa.me/${whatsappNumber}`, '_blank')}>
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" style={{ color: 'white' }}>
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.516 2.266 2.27 3.507 5.286 3.505 8.492-.005 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.023-5.11-2.887-6.978-1.864-1.868-4.343-2.899-6.984-2.9-5.439 0-9.865 4.422-9.869 9.86-.001 1.768.482 3.49 1.398 5.018l-.998 3.645 3.738-.981.014.009L6.647 19.15z"/>
          </svg>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <main className="main-wrapper">
        {/* Header */}
        <header className="header-bar">
          <div className="header-welcome">
            {/* Clickable Mobile Logo - only visible on mobile via CSS */}
            <div className="mobile-logo-header" onClick={handleLogoClick} style={{ cursor: 'pointer', display: 'none', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#6c25e2' }}>
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <span className="logo-text" style={{ fontSize: '18px', fontWeight: 800 }}>Goobox</span>
            </div>

            <h1>Olá, {user?.name || 'Cliente'}</h1>
            <p>Bem-vindo à Goobox. Impulsione suas redes sociais instantaneamente!</p>
          </div>
          <div className="header-actions">
            <div className="icon-box" title={`Minha Conta (${user?.email})`} onClick={() => setActiveTab('perfil')} style={{ cursor: 'pointer', border: activeTab === 'perfil' ? '1px solid var(--primary)' : '1px solid var(--border-color)', color: activeTab === 'perfil' ? 'var(--primary)' : 'var(--text-secondary)' }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div className="icon-box logout" title="Sair" onClick={handleLogout}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>
          </div>
        </header>

        {/* Mural de Avisos (Notificação Global) */}
        {announcementText && (
          <div 
            className={`payment-status-banner ${announcementType === 'success' ? 'approved' : announcementType === 'warning' ? 'pending' : 'pending'}`}
            style={{ 
              margin: '0 24px 20px 24px', 
              padding: '16px 20px', 
              borderRadius: '12px',
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              border: announcementType === 'warning' ? '1px solid rgba(255, 152, 0, 0.4)' : announcementType === 'success' ? '1px solid rgba(0, 191, 165, 0.4)' : '1px solid rgba(108, 37, 226, 0.4)',
              background: announcementType === 'warning' ? 'rgba(255, 152, 0, 0.05)' : announcementType === 'success' ? 'rgba(0, 191, 165, 0.05)' : 'rgba(108, 37, 226, 0.05)',
              color: announcementType === 'warning' ? '#ff9800' : announcementType === 'success' ? '#00bfa5' : '#a276ff'
            }}
          >
            <span style={{ fontSize: '18px' }}>
              {announcementType === 'success' ? '✓' : announcementType === 'warning' ? '⚠️' : '📢'}
            </span>
            <div style={{ flexGrow: 1, fontWeight: '500' }}>
              {announcementText}
            </div>
          </div>
        )}

        {/* Widgets Panel */}
        <section className="widgets-grid">
          <div className="widget-card">
            <div className="widget-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
            </div>
            <div className="widget-info">
              <span className="widget-title">Total pedidos</span>
              <span className="widget-value">{user?.totalOrders.toLocaleString('pt-BR') || 0}</span>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-icon" style={{ color: '#00bfa5', backgroundColor: 'rgba(0, 191, 165, 0.15)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M16 11V7a4 4 0 00-8 0v4"/>
              </svg>
            </div>
            <div className="widget-info">
              <span className="widget-title">Seu saldo</span>
              <span className="widget-value" style={{ color: '#00bfa5' }}>
                R$ {user?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 }) || '0,00'}
              </span>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-icon">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
            </div>
            <div className="widget-info">
              <span className="widget-title">Total gasto</span>
              <span className="widget-value">R$ {user?.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-icon" style={{ color: '#ffd700', backgroundColor: 'rgba(255, 215, 0, 0.15)' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="widget-info">
              <span className="widget-title">Status</span>
              <span className="widget-value" style={{ color: '#ffd700' }}>{user?.status || 'Membro'}</span>
            </div>
          </div>
        </section>

        {/* Dynamic Panels */}
        {activeTab === 'novo-pedido' && (
          <div className="content-split">
            {/* Left Order Form */}
            <div className="panel-card">
              <div className="panel-header">
                <div className="panel-header-icon">🛒</div>
                <div className="panel-header-info">
                  <h2>Faça um novo pedido</h2>
                  <p>Escolha o serviço desejado e crie sua campanha.</p>
                </div>
              </div>

              {orderFeedback && (
                <div className={`payment-status-banner ${orderFeedback.success ? 'approved' : 'pending'}`} style={{ marginBottom: '20px' }}>
                  {orderFeedback.message}
                </div>
              )}

              <form onSubmit={handlePlaceOrder}>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Serviço</label>
                  <select
                    className="form-select"
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                  >
                    {services
                      .filter(s => s.category === selectedCategory)
                      .map((srv) => (
                        <option key={srv.id} value={srv.id}>
                          {srv.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Link ou Usuário sem @</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://instagram.com/seu-perfil"
                    value={orderLink}
                    onChange={(e) => setOrderLink(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Quantidade</label>
                  <input
                    type="number"
                    className="form-input"
                    min={selectedService?.min || 10}
                    max={selectedService?.max || 10000}
                    value={orderQuantity}
                    onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 0)}
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Mínimo: {selectedService?.min || 10} | Máximo: {selectedService?.max || 10000}
                  </small>
                </div>

                <div className="price-display">
                  <span className="price-label">Preço Calculado</span>
                  <span className="price-value">R$ {calculatedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</span>
                </div>

                <button type="submit" className="submit-btn" disabled={!!(user && user.balance < calculatedPrice)}>
                  Fazer Pedido
                </button>
              </form>
            </div>

            {/* Right Info Description */}
            <div className="panel-card">
              <div className="panel-header secondary">
                <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.1)' }}>💬</div>
                <div className="panel-header-info">
                  <h2>Leia a descrição</h2>
                  <p>Detalhes importantes sobre o serviço ativo</p>
                </div>
              </div>

              {selectedService ? (
                <div className="description-content">
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>
                    #{selectedService.id} - {selectedService.name.split(' - ')[0]}
                  </h3>
                  <p className="description-text">
                    {selectedService.description}
                  </p>
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
                    <p style={{ color: 'var(--success)', fontWeight: 600 }}>⚡ Início: Instantâneo / Rápido</p>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '6px' }}>💰 Custo por 1.000 unidades: R$ {selectedService.ratePer1000.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Nenhum serviço selecionado no momento.</p>
              )}

              <p className="terms-note">
                Quando você faz um pedido, considera-se que você aceitou os <span className="terms-link" onClick={() => alert('Termos de Uso')}>Termos de Uso</span>.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'servicos' && (
          <div className="panel-card">
            <div className="panel-header secondary" style={{ marginBottom: '16px' }}>
              <div className="panel-header-icon">📋</div>
              <div className="panel-header-info">
                <h2>Tabela de Serviços SMM</h2>
                <p>Veja e busque todos os serviços disponíveis e custos</p>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="🔍 Digite para procurar serviços (ex: Instagram, TikTok)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="services-table-wrapper">
              <table className="smm-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Categoria</th>
                    <th>Nome do Serviço</th>
                    <th>Preço por 1000</th>
                    <th>Mín / Máx</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServicesList.map((srv) => (
                    <tr key={srv.id}>
                      <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>#{srv.id}</td>
                      <td><span className="badge processing" style={{ padding: '4px 8px', fontSize: '11px' }}>{srv.category}</span></td>
                      <td style={{ fontWeight: '500' }}>{srv.name.split(' - ')[0]}</td>
                      <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>R$ {srv.ratePer1000.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{srv.min} / {srv.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'adicionar-saldo' && (
          <>
            <div className="content-split">
              {/* Pix deposit card */}
              <div className="panel-card" style={{ margin: 0 }}>
                <div className="panel-header">
                  <div className="panel-header-icon">💸</div>
                  <div className="panel-header-info">
                    <h2>Adicionar Saldo com Pix</h2>
                    <p>Reabasteça sua conta instantaneamente 24 horas por dia via Pix.</p>
                  </div>
                </div>

                <div className="pix-container" style={{ display: 'block', padding: 0, marginTop: '20px' }}>
                  {/* Form Input */}
                  <div>
                    <form onSubmit={handleGeneratePix}>
                      <div className="form-group">
                        <label className="form-label">Valor da Recarga (BRL)</label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ fontSize: '18px', fontWeight: 'bold' }}
                          value={depositAmount}
                          onChange={(e) => {
                            setDepositAmount(e.target.value);
                            setAppliedCoupon(null);
                            setCouponFeedback(null);
                          }}
                          placeholder="Min: R$ 1,00"
                          min="1.00"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginTop: '14px' }}>
                        <label className="form-label">Cupom de Recarga (Opcional)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
                            value={couponCodeInput}
                            onChange={(e) => setCouponCodeInput(e.target.value)}
                            placeholder="Ex: BOASVINDAS10"
                          />
                          <button 
                            type="button" 
                            className="copy-btn" 
                            style={{ margin: 0, padding: '0 16px', fontSize: '13px' }}
                            onClick={handleApplyCoupon}
                          >
                            Aplicar
                          </button>
                        </div>
                      </div>

                      {couponFeedback && (
                        <div className={`payment-status-banner ${couponFeedback.success ? 'approved' : 'pending'}`} style={{ fontSize: '13px', marginTop: '10px' }}>
                          {couponFeedback.message}
                        </div>
                      )}

                      <button type="submit" className="submit-btn" style={{ marginTop: '16px' }} disabled={pixLoading}>
                        {pixLoading ? 'Gerando QR Code...' : 'Gerar QR Code Pix'}
                      </button>
                    </form>

                    {pixFeedback && (
                      <div className="payment-status-banner pending" style={{ marginTop: '20px' }}>
                        {pixFeedback.message}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Direct coupon redemption card */}
              <div className="panel-card" style={{ margin: 0 }}>
                <div className="panel-header secondary">
                  <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.15)', color: 'var(--primary)' }}>🎁</div>
                  <div className="panel-header-info">
                    <h2>Resgatar Saldo Grátis</h2>
                    <p>Tem um código promocional de resgate de saldo? Utilize-o aqui.</p>
                  </div>
                </div>

                <form onSubmit={handleRedeemDirectCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Código do Cupom</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'monospace' }}
                      value={directCouponInput}
                      onChange={(e) => setDirectCouponInput(e.target.value)}
                      placeholder="Ex: GRATIS5"
                      required
                    />
                  </div>

                  {directCouponFeedback && (
                    <div className={`payment-status-banner ${directCouponFeedback.success ? 'approved' : 'pending'}`} style={{ fontSize: '13px', justifyContent: 'center' }}>
                      {directCouponFeedback.message}
                    </div>
                  )}

                  <button type="submit" className="submit-btn" style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #512da8 100%)', boxShadow: '0 4px 15px rgba(108, 37, 226, 0.2)' }} disabled={isRedeemingDirect}>
                    {isRedeemingDirect ? 'Processando Resgate...' : 'Resgatar Saldo Grátis'}
                  </button>
                </form>
              </div>
            </div>

            {/* QR Code / Copia e Cola Display */}
              {generatedPix && (
                <div className="pix-qr-box">
                  <p style={{ fontWeight: 'bold', fontSize: '15px' }}>Escaneie para pagar:</p>
                  <img src={generatedPix.qrCodeBase64} alt="QR Code Pix" className="pix-qr-img" />
                  
                  <div style={{ width: '100%' }}>
                    <p className="form-label" style={{ marginBottom: '6px' }}>Código Copia e Cola:</p>
                    <textarea 
                      readOnly 
                      className="form-input pix-code-textarea"
                      value={generatedPix.qrCode}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                  </div>

                  <button 
                    className="copy-btn" 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPix.qrCode);
                      alert('Código Pix copiado para a área de transferência!');
                    }}
                  >
                    Copiar Código Pix
                  </button>

                  {generatedPix.status === 'pending' ? (
                    <div className="payment-status-banner pending" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="badge pending">Aguardando pagamento...</span>
                    </div>
                  ) : (
                    <div className="payment-status-banner approved" style={{ width: '100%', justifyContent: 'center' }}>
                      <span className="badge success">✓ Aprovado e Creditado!</span>
                    </div>
                  )}
                </div>
              )}

          <div className="panel-card" style={{ marginTop: '24px' }}>
            <div className="panel-header secondary">
              <div className="panel-header-icon">🧾</div>
              <div className="panel-header-info">
                <h2>Histórico de Depósitos</h2>
                <p>Veja o status de todas as suas tentativas de recarga Pix</p>
              </div>
            </div>

            <div className="services-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="smm-table">
                <thead>
                  <tr>
                    <th>ID da Transação</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        Nenhum depósito iniciado ainda.
                      </td>
                    </tr>
                  ) : (
                    payments.map((pay) => (
                      <tr key={pay.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{pay.id}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                          R$ {pay.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span className={`badge ${pay.status === 'approved' ? 'success' : pay.status === 'rejected' ? 'error' : 'processing'}`}>
                            {pay.status === 'approved' ? 'Aprovado' : pay.status === 'rejected' ? 'Recusado' : 'Pendente'}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(pay.createdAt).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}

        {activeTab === 'pedidos' && (
          <div className="panel-card">
            <div className="panel-header secondary">
              <div className="panel-header-icon">📦</div>
              <div className="panel-header-info">
                <h2>Histórico de Pedidos</h2>
                <p>Acompanhe o andamento dos seus pedidos em tempo real</p>
              </div>
            </div>

            <div className="services-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="smm-table">
                <thead>
                  <tr>
                    <th>ID Pedido</th>
                    <th>Serviço</th>
                    <th>Link</th>
                    <th>Quantidade</th>
                    <th>Valor Cobrado</th>
                    <th>Status</th>
                    <th>Data</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        Nenhum pedido realizado ainda.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id}>
                        <td>#{ord.id}</td>
                        <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.serviceName}>
                          {ord.serviceName}
                        </td>
                        <td>
                          <a href={ord.link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                            Acessar Link
                          </a>
                        </td>
                        <td>{ord.quantity}</td>
                        <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                          R$ {ord.charge.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                        </td>
                        <td>
                          <span className={`badge ${ord.status === 'Concluido' ? 'success' : ord.status === 'Cancelado' ? 'error' : ord.status === 'Parcial' ? 'pending' : 'processing'}`}>
                            {ord.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {new Date(ord.createdAt).toLocaleString('pt-BR')}
                        </td>
                        <td>
                          {ord.status === 'Concluido' && !isNaN(Number(ord.serviceId)) ? (
                            <button
                              className="copy-btn"
                              style={{
                                margin: 0,
                                padding: '4px 10px',
                                fontSize: '11px',
                                whiteSpace: 'nowrap',
                                borderRadius: '6px',
                                background: 'rgba(108, 37, 226, 0.1)',
                                color: 'var(--primary)',
                                border: '1px solid rgba(108, 37, 226, 0.2)',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleRequestRefill(ord.id)}
                              disabled={refillLoading === ord.id}
                            >
                              {refillLoading === ord.id ? 'Processando...' : 'Solicitar Refil'}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'extrato' && (
          <div className="panel-card">
            <div className="panel-header secondary">
              <div className="panel-header-icon">🧾</div>
              <div className="panel-header-info">
                <h2>Extrato Financeiro</h2>
                <p>Veja todo o histórico de entradas e saídas do seu saldo</p>
              </div>
            </div>

            <div className="services-table-wrapper" style={{ marginTop: '20px' }}>
              <table className="smm-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                        Nenhuma transação registrada ainda.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      const typeMap: Record<string, { text: string; class: string }> = {
                        deposit: { text: 'Depósito', class: 'success' },
                        order: { text: 'Pedido SMM', class: 'processing' },
                        refund: { text: 'Estorno', class: 'success' },
                        bonus: { text: 'Bônus', class: 'success' }
                      };
                      const typeInfo = typeMap[tx.type] || { text: tx.type, class: 'pending' };

                      return (
                        <tr key={tx.id}>
                          <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {new Date(tx.createdAt).toLocaleString('pt-BR')}
                          </td>
                          <td>
                            <span className={`badge ${typeInfo.class}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                              {typeInfo.text}
                            </span>
                          </td>
                          <td style={{ fontWeight: '500' }}>{tx.description}</td>
                          <td style={{ color: isPositive ? 'var(--success)' : 'var(--error)', fontWeight: 'bold' }}>
                            {isPositive ? '+' : ''} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'suporte' && (
          <div className="panel-card">
            <div className="panel-header secondary">
              <div className="panel-header-icon">💬</div>
              <div className="panel-header-info">
                <h2>Suporte & Tickets</h2>
                <p>Abra um ticket ou converse diretamente com nossa equipe de suporte</p>
              </div>
            </div>

            {selectedTicketId === null ? (
              <div className="content-split" style={{ marginTop: '20px' }}>
                {/* Criar Ticket */}
                <div className="panel-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)' }}>Abrir Novo Chamado</h3>
                  <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <label className="form-label">Assunto</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Ex: Dúvida sobre pedido, Problema com Pix..." 
                        value={ticketSubject}
                        onChange={(e) => setTicketSubject(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label">Mensagem detalhada</label>
                      <textarea 
                        className="form-input" 
                        rows={5} 
                        placeholder="Descreva seu problema ou dúvida com o máximo de detalhes possível..." 
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        required
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    <button type="submit" className="payment-btn" style={{ margin: '0' }}>
                      Criar Ticket
                    </button>
                  </form>
                </div>

                {/* Meus Tickets */}
                <div className="panel-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)' }}>Seus Chamados</h3>
                  <div className="services-table-wrapper">
                    <table className="smm-table">
                      <thead>
                        <tr>
                          <th>Assunto</th>
                          <th>Status</th>
                          <th>Opções</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                              Nenhum ticket aberto ainda.
                            </td>
                          </tr>
                        ) : (
                          tickets.map((t) => {
                            const statusMap = {
                              aberto: { text: 'Aberto', class: 'pending' },
                              respondido: { text: 'Respondido', class: 'success' },
                              fechado: { text: 'Fechado', class: 'disabled' }
                            };
                            const statusInfo = statusMap[t.status] || { text: t.status, class: 'pending' };

                            return (
                              <tr key={t.id}>
                                <td style={{ fontWeight: '500' }}>
                                  {t.subject}
                                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${statusInfo.class}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                    {statusInfo.text}
                                  </span>
                                </td>
                                <td>
                                  <button 
                                    className="copy-btn" 
                                    style={{ margin: '0', padding: '6px 12px', fontSize: '12px' }}
                                    onClick={() => setSelectedTicketId(t.id)}
                                  >
                                    Ver Conversa
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Chat Thread view
              <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {(() => {
                  const currentTicket = tickets.find(t => t.id === selectedTicketId);
                  if (!currentTicket) {
                    return (
                      <div>
                        <p>Ticket não encontrado.</p>
                        <button className="copy-btn" onClick={() => setSelectedTicketId(null)}>Voltar</button>
                      </div>
                    );
                  }

                  const statusMap = {
                    aberto: { text: 'Aberto', class: 'pending' },
                    respondido: { text: 'Respondido', class: 'success' },
                    fechado: { text: 'Fechado', class: 'disabled' }
                  };
                  const statusInfo = statusMap[currentTicket.status] || { text: currentTicket.status, class: 'pending' };

                  return (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <button 
                            className="copy-btn" 
                            style={{ margin: '0 12px 0 0', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            onClick={() => setSelectedTicketId(null)}
                          >
                            ← Voltar
                          </button>
                          <h3 style={{ display: 'inline-block', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {currentTicket.subject}
                          </h3>
                          <span className={`badge ${statusInfo.class}`} style={{ marginLeft: '12px', padding: '4px 8px', fontSize: '11px' }}>
                            {statusInfo.text}
                          </span>
                        </div>
                        {currentTicket.status !== 'fechado' && (
                          <button 
                            className="copy-btn" 
                            style={{ margin: 0, padding: '6px 12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                            onClick={() => handleCloseTicket(currentTicket.id)}
                          >
                            Encerrar Ticket
                          </button>
                        )}
                      </div>

                      {/* Chat Messages scroll area */}
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px', 
                        maxHeight: '400px', 
                        overflowY: 'auto', 
                        padding: '16px', 
                        borderRadius: '12px', 
                        backgroundColor: 'var(--bg-tertiary)',
                        border: '1px solid var(--border-color)' 
                      }}>
                        {selectedTicketMessages.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma mensagem.</p>
                        ) : (
                          selectedTicketMessages.map((msg) => {
                            const isAdmin = msg.sender === 'admin';
                            return (
                              <div 
                                key={msg.id} 
                                style={{ 
                                  alignSelf: isAdmin ? 'flex-start' : 'flex-end',
                                  maxWidth: '75%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: isAdmin ? 'flex-start' : 'flex-end'
                                }}
                              >
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', padding: '0 4px' }}>
                                  {isAdmin ? '📌 Equipe Goobox' : 'Você'}
                                </span>
                                <div style={{ 
                                  padding: '12px 16px', 
                                  borderRadius: '16px', 
                                  borderTopLeftRadius: isAdmin ? '4px' : '16px',
                                  borderTopRightRadius: isAdmin ? '16px' : '4px',
                                  backgroundColor: isAdmin ? 'var(--bg-card)' : 'var(--primary)',
                                  color: isAdmin ? 'var(--text-primary)' : 'white',
                                  border: isAdmin ? '1px solid var(--border-color)' : 'none',
                                  fontSize: '14px',
                                  lineHeight: '1.5',
                                  wordBreak: 'break-word'
                                }}>
                                  {msg.message}
                                </div>
                                <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', padding: '0 4px' }}>
                                  {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Reply Form */}
                      {currentTicket.status === 'fechado' ? (
                        <div className="payment-status-banner pending" style={{ margin: 0, textAlign: 'center' }}>
                          Este chamado está encerrado. Se precisar de mais ajuda, por favor abra um novo chamado.
                        </div>
                      ) : (
                        <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '12px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Digite sua resposta..." 
                            value={ticketReply}
                            onChange={(e) => setTicketReply(e.target.value)}
                            required
                            style={{ flexGrow: 1 }}
                          />
                          <button type="submit" className="payment-btn" style={{ margin: 0, padding: '0 24px', flexShrink: 0 }}>
                            Enviar
                          </button>
                        </form>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'api' && (
          <div className="panel-card">
            <div className="panel-header secondary">
              <div className="panel-header-icon">⚙️</div>
              <div className="panel-header-info">
                <h2>API de Integração para Revendedores</h2>
                <p>Integre nosso painel SMM no seu próprio site ou subpainel</p>
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>Informações Básicas</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                  Oferecemos suporte a APIs REST padrão compatíveis com a maioria dos painéis SMM do mercado. 
                  Você pode usar a URL abaixo para puxar nossa tabela de serviços e criar pedidos automaticamente.
                </p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                <p className="form-label" style={{ marginBottom: '6px' }}>Endpoint da API SMM:</p>
                <code style={{ color: '#00bfa5', fontSize: '14px', wordBreak: 'break-all' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/api/services` : 'https://gooboxsmm.com/api/services'}
                </code>
              </div>

              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>Token de API (Key)</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input 
                    type="password" 
                    readOnly 
                    className="form-input" 
                    style={{ flexGrow: 1, fontFamily: 'monospace' }} 
                    value="gb_5c16c524cb4217bc45e6a8da6238743"
                  />
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText("gb_5c16c524cb4217bc45e6a8da6238743");
                      alert('Chave de API copiada!');
                    }}
                  >
                    Copiar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'admin' && user?.role === 'admin' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Admin Sub-Tabs Navigation */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="copy-btn"
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  background: adminTab === 'geral' ? 'var(--primary)' : 'transparent',
                  color: adminTab === 'geral' ? 'white' : 'var(--text-secondary)',
                  border: adminTab === 'geral' ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                }}
                onClick={() => setAdminTab('geral')}
              >
                ⚙️ Configuração Geral
              </button>
              <button 
                type="button"
                className="copy-btn"
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  background: adminTab === 'usuarios' ? 'var(--primary)' : 'transparent',
                  color: adminTab === 'usuarios' ? 'white' : 'var(--text-secondary)',
                  border: adminTab === 'usuarios' ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                }}
                onClick={() => setAdminTab('usuarios')}
              >
                👥 Usuários ({adminUsers.length})
              </button>
              <button 
                type="button"
                className="copy-btn"
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  background: adminTab === 'servicos' ? 'var(--primary)' : 'transparent',
                  color: adminTab === 'servicos' ? 'white' : 'var(--text-secondary)',
                  border: adminTab === 'servicos' ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                }}
                onClick={() => setAdminTab('servicos')}
              >
                🛠️ Serviços SMM ({services.length})
              </button>
              <button 
                type="button"
                className="copy-btn"
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  background: adminTab === 'pedidos' ? 'var(--primary)' : 'transparent',
                  color: adminTab === 'pedidos' ? 'white' : 'var(--text-secondary)',
                  border: adminTab === 'pedidos' ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                }}
                onClick={() => setAdminTab('pedidos')}
              >
                📦 Gerenciar Pedidos ({adminOrders.length})
              </button>
              <button 
                type="button"
                className="copy-btn"
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  background: adminTab === 'cupons' ? 'var(--primary)' : 'transparent',
                  color: adminTab === 'cupons' ? 'white' : 'var(--text-secondary)',
                  border: adminTab === 'cupons' ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                }}
                onClick={() => setAdminTab('cupons')}
              >
                🎁 Cupons Promocionais ({adminCoupons.length})
              </button>
              <button 
                type="button"
                className="copy-btn"
                style={{ 
                  margin: 0, 
                  padding: '8px 16px', 
                  borderRadius: '8px',
                  background: adminTab === 'suporte' ? 'var(--primary)' : 'transparent',
                  color: adminTab === 'suporte' ? 'white' : 'var(--text-secondary)',
                  border: adminTab === 'suporte' ? '1px solid var(--primary)' : '1px solid var(--border-color)'
                }}
                onClick={() => { setAdminTab('suporte'); setSelectedTicketId(null); }}
              >
                💬 Tickets de Suporte ({tickets.filter(t => t.status === 'aberto').length} abertos)
              </button>
            </div>

            {/* Sub-Tab: Geral */}
            {adminTab === 'geral' && (
              <>
                {/* Metrics cards grid */}
                <div className="widgets-grid" style={{ marginBottom: '0px' }}>
                  <div className="widget-card">
                    <div className="widget-icon" style={{ color: 'var(--primary)', backgroundColor: 'rgba(108, 37, 226, 0.15)' }}>💸</div>
                    <div className="widget-info">
                      <span className="widget-title">Faturamento Pix (Total)</span>
                      <span className="widget-value">R$ {adminMetrics?.totalBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                      <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Últimos 30 dias: R$ {adminMetrics?.monthlyBilling.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</small>
                    </div>
                  </div>

                  <div className="widget-card">
                    <div className="widget-icon" style={{ color: 'var(--success)', backgroundColor: 'rgba(0, 191, 165, 0.15)' }}>📈</div>
                    <div className="widget-info">
                      <span className="widget-title">Lucro Estimado</span>
                      <span className="widget-value" style={{ color: 'var(--success)' }}>R$ {adminMetrics?.estimatedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</span>
                      <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Calculado sobre markup global</small>
                    </div>
                  </div>

                  <div className="widget-card">
                    <div className="widget-icon" style={{ color: '#ff9800', backgroundColor: 'rgba(255, 152, 0, 0.15)' }}>📦</div>
                    <div className="widget-info">
                      <span className="widget-title">Total de Pedidos SMM</span>
                      <span className="widget-value">{adminMetrics?.totalOrders || 0}</span>
                      <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Realizados no painel</small>
                    </div>
                  </div>

                  <div className="widget-card">
                    <div className="widget-icon" style={{ color: '#ffd700', backgroundColor: 'rgba(255, 215, 0, 0.15)' }}>👥</div>
                    <div className="widget-info">
                      <span className="widget-title">Total de Clientes</span>
                      <span className="widget-value">{adminMetrics?.totalUsers || 0}</span>
                      <small style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Cadastrados na base</small>
                    </div>
                  </div>
                </div>

                <div className="content-split">
                  {/* Global settings card */}
                  <div className="panel-card">
                    <div className="panel-header">
                      <div className="panel-header-icon">⚙️</div>
                      <div className="panel-header-info">
                        <h2>Configurações do Painel</h2>
                        <p>Defina o markup de lucro e informações de contato do suporte</p>
                      </div>
                    </div>

                    {adminFeedback && (adminFeedback.message.includes('Configurações') || adminFeedback.message.includes('lucro') || adminFeedback.message.includes('WhatsApp') || adminFeedback.message.includes('margem') || adminFeedback.message.includes('Aviso') || adminFeedback.message.includes('tipo')) && (
                      <div className={`payment-status-banner ${adminFeedback.success ? 'approved' : 'pending'}`} style={{ marginBottom: '20px' }}>
                        {adminFeedback.message}
                      </div>
                    )}

                    <form onSubmit={handleUpdateSettings}>
                      <div className="form-group">
                        <label className="form-label">Markup Global (%)</label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ fontSize: '18px', fontWeight: 'bold' }}
                          value={markupPercent}
                          onChange={(e) => setMarkupPercent(parseFloat(e.target.value) || 0)}
                          min="0"
                          max="500"
                          step="1"
                          required
                        />
                        <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Exemplo: 20% de markup transformará um custo de fornecedor de R$ 5,00 em R$ 6,00 para os clientes.
                        </small>
                      </div>

                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">WhatsApp de Suporte (DDI + DDD + Número)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}
                          value={whatsappNumber}
                          onChange={(e) => setWhatsappNumber(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">Aviso Global (Mural de Avisos)</label>
                        <textarea
                          className="form-input"
                          style={{ fontSize: '14px', fontFamily: 'inherit', height: '80px', resize: 'vertical', padding: '12px' }}
                          value={announcementText}
                          onChange={(e) => setAnnouncementText(e.target.value)}
                          placeholder="Escreva um aviso para exibir no topo do painel dos clientes (deixe em branco para ocultar)"
                        />
                      </div>

                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label className="form-label">Tipo de Aviso</label>
                        <select
                          className="form-select"
                          value={announcementType}
                          onChange={(e) => setAnnouncementType(e.target.value as any)}
                        >
                          <option value="info">📢 Informativo (Roxo)</option>
                          <option value="warning">⚠️ Alerta (Laranja)</option>
                          <option value="success">✓ Sucesso (Verde)</option>
                        </select>
                      </div>

                      <button type="submit" className="submit-btn" style={{ marginTop: '20px' }} disabled={isSavingMarkup}>
                        {isSavingMarkup ? 'Salvando...' : 'Salvar Configurações'}
                      </button>
                    </form>
                  </div>

                  {/* Quick balance adjustment card */}
                  <div className="panel-card">
                    <div className="panel-header secondary">
                      <div className="panel-header-icon" style={{ backgroundColor: 'rgba(0, 191, 165, 0.15)', color: 'var(--success)' }}>💰</div>
                      <div className="panel-header-info">
                        <h2>Adicionar / Retirar Saldo</h2>
                        <p>Ajuste o saldo de qualquer usuário na plataforma</p>
                      </div>
                    </div>

                    {adminFeedback && adminFeedback.message.includes('Saldo') && (
                      <div className={`payment-status-banner ${adminFeedback.success ? 'approved' : 'pending'}`} style={{ marginBottom: '20px' }}>
                        {adminFeedback.message}
                      </div>
                    )}

                    <form onSubmit={handleAdjustBalance}>
                      <div className="form-group">
                        <label className="form-label">Selecionar Usuário</label>
                        <select
                          className="form-select"
                          value={adjustingUserEmail}
                          onChange={(e) => setAdjustingUserEmail(e.target.value)}
                          required
                        >
                          <option value="">Selecione um usuário...</option>
                          {adminUsers.map((u) => (
                            <option key={u.email} value={u.email}>
                              {u.name} ({u.email}) - Saldo: R$ {u.balance.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Valor do Ajuste (BRL)</label>
                        <input
                          type="number"
                          className="form-input"
                          style={{ fontFamily: 'monospace' }}
                          value={adjustmentAmount}
                          onChange={(e) => setAdjustmentAmount(e.target.value)}
                          placeholder="Ex: 50.00 ou -20.00"
                          step="0.01"
                          required
                        />
                        <small style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Valores positivos adicionam saldo. Valores negativos subtraem saldo.
                        </small>
                      </div>

                      <button type="submit" className="submit-btn" style={{ background: 'linear-gradient(135deg, var(--success) 0%, #00897b 100%)', boxShadow: '0 4px 15px rgba(0, 191, 165, 0.2)' }} disabled={isAdjustingBalance || !adjustingUserEmail}>
                        {isAdjustingBalance ? 'Processando...' : 'Aplicar Ajuste de Saldo'}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* Sub-Tab: Usuarios */}
            {adminTab === 'usuarios' && (
              <>
                <div className="content-split">
                  {/* Create User Card */}
                  <div className="panel-card">
                    <div className="panel-header secondary">
                      <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.15)', color: 'var(--primary)' }}>👤</div>
                      <div className="panel-header-info">
                        <h2>Cadastrar Novo Usuário</h2>
                        <p>Crie um novo cliente ou administrador no sistema</p>
                      </div>
                    </div>

                    {adminFeedback && adminFeedback.message.includes('cadastrado') && (
                      <div className={`payment-status-banner ${adminFeedback.success ? 'approved' : 'pending'}`} style={{ marginBottom: '20px' }}>
                        {adminFeedback.message}
                      </div>
                    )}

                    <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Nome Completo</label>
                          <input
                            type="text"
                            className="form-input"
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            placeholder="Ex: João Silva"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">E-mail</label>
                          <input
                            type="email"
                            className="form-input"
                            value={createEmail}
                            onChange={(e) => setCreateEmail(e.target.value)}
                            placeholder="Ex: joao@gmail.com"
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Senha</label>
                          <input
                            type="password"
                            className="form-input"
                            value={createPassword}
                            onChange={(e) => setCreatePassword(e.target.value)}
                            placeholder="Min 6 caracteres"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Saldo Inicial (BRL)</label>
                          <input
                            type="number"
                            className="form-input"
                            value={createBalance}
                            onChange={(e) => setCreateBalance(e.target.value)}
                            placeholder="Ex: 50.00"
                            step="0.01"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Função / Tipo de Conta</label>
                        <select
                          className="form-select"
                          value={createRole}
                          onChange={(e) => setCreateRole(e.target.value)}
                          required
                        >
                          <option value="user">Cliente Comum (user)</option>
                          <option value="admin">Administrador (admin)</option>
                        </select>
                      </div>

                      <button type="submit" className="submit-btn" style={{ marginTop: '6px' }} disabled={isCreatingUser}>
                        {isCreatingUser ? 'Criando Conta...' : 'Cadastrar Usuário'}
                      </button>
                    </form>
                  </div>

                  {/* Admin Quick Guide Card */}
                  <div className="panel-card">
                    <div className="panel-header secondary">
                      <div className="panel-header-icon" style={{ backgroundColor: 'rgba(255, 215, 0, 0.15)', color: '#ffd700' }}>💡</div>
                      <div className="panel-header-info">
                        <h2>Guia de Administração</h2>
                        <p>Dicas rápidas para gerenciar seu painel SMM</p>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px', lineHeight: 1.5 }}>
                      <p>🔹 <strong>Markup dos Serviços:</strong> A porcentagem configurada calcula automaticamente a diferença entre o custo base do provedor e o preço cobrado dos seus clientes.</p>
                      <p>🔹 <strong>Exclusão de Contas:</strong> Ao excluir um usuário, todos os dados associados a ele no Supabase são removidos permanentemente. O admin principal não pode ser excluído.</p>
                      <p>🔹 <strong>Faturamento Real:</strong> Os valores de faturamento exibidos no painel refletem apenas as recargas Pix que foram de fato concluídas e pagas via Mercado Pago.</p>
                    </div>
                  </div>
                </div>

                {/* Users table card */}
                <div className="panel-card">
                  <div className="panel-header secondary">
                    <div className="panel-header-icon">👥</div>
                    <div className="panel-header-info">
                      <h2>Usuários Cadastrados</h2>
                      <p>Visualize e administre as contas e dados de uso dos clientes</p>
                    </div>
                  </div>

                  {adminLoading ? (
                    <p style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>Buscando dados de usuários...</p>
                  ) : (
                    <div className="services-table-wrapper" style={{ marginTop: '20px' }}>
                      <table className="smm-table">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>E-mail</th>
                            <th>Status</th>
                            <th>Função</th>
                            <th>Saldo</th>
                            <th>Pedidos Realizados</th>
                            <th>Total Gasto</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.length === 0 ? (
                            <tr>
                              <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                                Nenhum usuário cadastrado.
                              </td>
                            </tr>
                          ) : (
                            adminUsers.map((u) => (
                              <tr key={u.email}>
                                <td style={{ fontWeight: '600' }}>{u.name}</td>
                                <td>{u.email}</td>
                                <td>
                                  <span className="badge processing" style={{ textTransform: 'capitalize' }}>{u.status}</span>
                                </td>
                                <td>
                                  <span className="badge" style={{ 
                                    backgroundColor: u.role === 'admin' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(108, 37, 226, 0.15)',
                                    color: u.role === 'admin' ? 'var(--error)' : 'var(--primary)'
                                  }}>
                                    {u.role === 'admin' ? 'Administrador' : 'Cliente'}
                                  </span>
                                </td>
                                <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                  R$ {u.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                                </td>
                                <td>{u.totalOrders}</td>
                                <td>R$ {u.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td style={{ textAlign: 'center' }}>
                                  {u.email.toLowerCase() !== 'admin@goobox.com' && u.email.toLowerCase() !== user?.email.toLowerCase() ? (
                                    <button
                                      type="button"
                                      className="delete-user-btn"
                                      onClick={() => handleDeleteUser(u.email)}
                                    >
                                      Excluir
                                    </button>
                                  ) : (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontStyle: 'italic' }}>Ativo (Principal)</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sub-Tab: Servicos */}
            {adminTab === 'servicos' && (
              <div className="panel-card">
                <div className="panel-header secondary" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="panel-header-icon" style={{ backgroundColor: 'rgba(0, 191, 165, 0.15)', color: 'var(--success)' }}>🛠️</div>
                    <div className="panel-header-info">
                      <h2>Gerenciamento de Serviços SMM</h2>
                      <p>Adicione, edite, exclua ou sincronize serviços do painel</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      type="button"
                      className="submit-btn" 
                      style={{ margin: 0, padding: '8px 16px', background: 'linear-gradient(135deg, var(--primary) 0%, #512da8 100%)', width: 'auto' }}
                      onClick={() => handleOpenServiceModal('create')}
                    >
                      + Novo Serviço
                    </button>
                    <button 
                      type="button"
                      className="submit-btn" 
                      style={{ margin: 0, padding: '8px 16px', background: 'linear-gradient(135deg, var(--success) 0%, #00897b 100%)', width: 'auto' }}
                      onClick={handleSyncServices}
                      disabled={isSyncingServices}
                    >
                      {isSyncingServices ? 'Sincronizando...' : '🔄 Sincronizar Provedor'}
                    </button>
                  </div>
                </div>

                {adminFeedback && adminFeedback.message.includes('serviço') && (
                  <div className={`payment-status-banner ${adminFeedback.success ? 'approved' : 'pending'}`} style={{ marginTop: '20px' }}>
                    {adminFeedback.message}
                  </div>
                )}

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: '6px' }}>Buscar por Nome ou ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Instagram Seguidores..."
                      value={adminServiceSearch}
                      onChange={(e) => setAdminServiceSearch(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: '6px' }}>Filtrar por Categoria</label>
                    <select
                      className="form-select"
                      value={adminServiceCategoryFilter}
                      onChange={(e) => setAdminServiceCategoryFilter(e.target.value)}
                    >
                      <option value="">Todas as categorias</option>
                      {Array.from(new Set(services.map(s => s.category))).map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="services-table-wrapper" style={{ marginTop: '12px' }}>
                  <table className="smm-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Categoria</th>
                        <th>Nome</th>
                        <th>Preço por 1000</th>
                        <th>Mín / Máx</th>
                        <th style={{ textAlign: 'center' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdminServices.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                            Nenhum serviço correspondente encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredAdminServices.slice(0, 50).map((srv) => (
                          <tr key={srv.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--primary)' }}>#{srv.id}</td>
                            <td><span className="badge processing" style={{ padding: '4px 8px', fontSize: '11px' }}>{srv.category}</span></td>
                            <td style={{ fontWeight: '500', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={srv.name}>{srv.name}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>R$ {srv.ratePer1000.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{srv.min} / {srv.max}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="copy-btn"
                                  style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}
                                  onClick={() => handleOpenServiceModal('edit', srv)}
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  className="delete-user-btn"
                                  style={{ margin: 0, padding: '4px 10px', fontSize: '12px' }}
                                  onClick={() => handleDeleteService(srv.id)}
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredAdminServices.length > 50 && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '11px', textAlign: 'center', marginTop: '12px', fontStyle: 'italic' }}>
                    Exibindo os primeiros 50 serviços de {filteredAdminServices.length}. Use a busca ou filtros para refinar.
                  </p>
                )}
              </div>
            )}

            {/* Sub-Tab: Pedidos (Novo Recurso) */}
            {adminTab === 'pedidos' && (
              <div className="panel-card">
                <div className="panel-header secondary" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.15)', color: 'var(--primary)' }}>📦</div>
                    <div className="panel-header-info">
                      <h2>Gerenciamento de Pedidos SMM</h2>
                      <p>Visualize todos os pedidos, atualize status ou realize reembolsos</p>
                    </div>
                  </div>
                </div>

                {adminFeedback && (adminFeedback.message.includes('pedido') || adminFeedback.message.includes('Status') || adminFeedback.message.includes('Reembolsado') || adminFeedback.message.includes('Estorno')) && (
                  <div className={`payment-status-banner ${adminFeedback.success ? 'approved' : 'pending'}`} style={{ marginTop: '20px', marginBottom: '20px' }}>
                    {adminFeedback.message}
                  </div>
                )}

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: '6px' }}>Buscar por ID, Email ou Link</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: 58291, cliente@email.com..."
                      value={adminOrdersSearch}
                      onChange={(e) => setAdminOrdersSearch(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ marginBottom: '6px' }}>Filtrar por Status</label>
                    <select
                      className="form-select"
                      value={adminOrdersStatusFilter}
                      onChange={(e) => setAdminOrdersStatusFilter(e.target.value)}
                    >
                      <option value="">Todos os status</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Processando">Processando</option>
                      <option value="Concluido">Concluido</option>
                      <option value="Cancelado">Cancelado</option>
                      <option value="Parcial">Parcial</option>
                    </select>
                  </div>
                </div>

                {/* Table */}
                {adminOrdersLoading ? (
                  <p style={{ color: 'var(--text-secondary)', padding: '24px', textAlign: 'center' }}>Carregando pedidos...</p>
                ) : (
                  <div className="services-table-wrapper" style={{ marginTop: '12px' }}>
                    <table className="smm-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Cliente</th>
                          <th>Serviço</th>
                          <th>Quantidade</th>
                          <th>Cobrado</th>
                          <th>Status</th>
                          <th>Data</th>
                          <th style={{ textAlign: 'center' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const filtered = adminOrders.filter(o => {
                            const matchesSearch = o.id.toLowerCase().includes(adminOrdersSearch.toLowerCase()) ||
                              (o.userEmail || '').toLowerCase().includes(adminOrdersSearch.toLowerCase()) ||
                              o.link.toLowerCase().includes(adminOrdersSearch.toLowerCase());
                            const matchesStatus = adminOrdersStatusFilter ? o.status === adminOrdersStatusFilter : true;
                            return matchesSearch && matchesStatus;
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                                  Nenhum pedido correspondente encontrado.
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((ord) => (
                            <tr key={ord.id}>
                              <td style={{ fontWeight: 'bold' }}>#{ord.id}</td>
                              <td style={{ fontSize: '13px' }} title={ord.userEmail}>{ord.userEmail}</td>
                              <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ord.serviceName}>
                                {ord.serviceName}
                              </td>
                              <td>{ord.quantity}</td>
                              <td style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                                R$ {ord.charge.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 5 })}
                              </td>
                              <td>
                                <span className={`badge ${ord.status === 'Concluido' ? 'success' : ord.status === 'Cancelado' ? 'error' : ord.status === 'Parcial' ? 'pending' : 'processing'}`}>
                                  {ord.status}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {new Date(ord.createdAt).toLocaleString('pt-BR')}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                  <select
                                    className="form-select"
                                    style={{ margin: 0, padding: '2px 6px', fontSize: '11px', width: 'auto' }}
                                    value={ord.status}
                                    onChange={(e) => handleAdminOrderAction(ord.id, 'update_status', e.target.value)}
                                  >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Processando">Processando</option>
                                    <option value="Concluido">Concluido</option>
                                    <option value="Cancelado">Cancelado</option>
                                    <option value="Parcial">Parcial</option>
                                  </select>
                                  {ord.status !== 'Cancelado' && (
                                    <button
                                      className="copy-btn"
                                      style={{ margin: 0, padding: '2px 6px', fontSize: '11px', borderColor: 'var(--error)', color: 'var(--error)' }}
                                      onClick={() => {
                                        if (confirm(`Deseja cancelar e estornar o pedido #${ord.id}?`)) {
                                          handleAdminOrderAction(ord.id, 'refund');
                                        }
                                      }}
                                    >
                                      Estornar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Sub-Tab: Cupons */}
            {adminTab === 'cupons' && (
              <div className="panel-card">
                <div className="panel-header secondary">
                  <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.15)', color: 'var(--primary)' }}>🎁</div>
                  <div className="panel-header-info">
                    <h2>Cupons Promocionais</h2>
                    <p>Crie códigos promocionais para os clientes ganharem bônus em depósitos ou resgatarem saldo grátis</p>
                  </div>
                </div>

                {adminFeedback && (adminFeedback.message.includes('Cupom') || adminFeedback.message.includes('cupom')) && (
                  <div className={`payment-status-banner ${adminFeedback.success ? 'approved' : 'pending'}`} style={{ marginTop: '20px', marginBottom: '20px' }}>
                    {adminFeedback.message}
                  </div>
                )}

                <div className="content-split" style={{ marginTop: '20px' }}>
                  {/* Form to create coupon */}
                  <div className="panel-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)' }}>Criar Novo Cupom</h3>
                    <form onSubmit={handleCreateCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="form-group">
                        <label className="form-label">Código do Cupom</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="EX: BOASVINDAS20"
                          value={createCouponCode}
                          onChange={(e) => setCreateCouponCode(e.target.value)}
                          required
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Tipo de Desconto</label>
                          <select
                            className="form-select"
                            value={createCouponType}
                            onChange={(e) => setCreateCouponType(e.target.value as any)}
                          >
                            <option value="percentage">Porcentagem (%)</option>
                            <option value="fixed">Fixo (R$)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Valor</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Ex: 10 para 10% ou 5 para R$5"
                            value={createCouponValue}
                            onChange={(e) => setCreateCouponValue(e.target.value)}
                            step="0.01"
                            min="0.01"
                            required
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label">Depósito Mínimo (R$)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Ex: 30.00"
                            value={createCouponMinDeposit}
                            onChange={(e) => setCreateCouponMinDeposit(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Limite de Usos (Máx)</label>
                          <input
                            type="number"
                            className="form-input"
                            placeholder="Deixe em branco para ilimitado"
                            value={createCouponMaxUses}
                            onChange={(e) => setCreateCouponMaxUses(e.target.value)}
                            min="1"
                          />
                        </div>
                      </div>

                      <button type="submit" className="payment-btn" style={{ margin: 0 }} disabled={isCreatingCoupon}>
                        {isCreatingCoupon ? 'Criando...' : 'Criar Cupom'}
                      </button>
                    </form>
                  </div>

                  {/* List of coupons */}
                  <div className="panel-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)' }}>Cupons Ativos</h3>
                    <div className="services-table-wrapper">
                      <table className="smm-table">
                        <thead>
                          <tr>
                            <th>Código</th>
                            <th>Tipo / Valor</th>
                            <th>Regras</th>
                            <th>Usos</th>
                            <th style={{ textAlign: 'center' }}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminCoupons.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                                Nenhum cupom criado ainda.
                              </td>
                            </tr>
                          ) : (
                            adminCoupons.map((c) => (
                              <tr key={c.code}>
                                <td style={{ fontWeight: 'bold' }}>{c.code}</td>
                                <td>
                                  {c.type === 'percentage' ? `${c.value}%` : `R$ ${c.value.toFixed(2)}`}
                                </td>
                                <td style={{ fontSize: '12px' }}>
                                  Min Dep: R$ {c.minDeposit.toFixed(2)}
                                </td>
                                <td>
                                  {c.usedCount} {c.maxUses ? `/ ${c.maxUses}` : '(Ilimitado)'}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <button
                                    className="copy-btn"
                                    style={{ margin: 0, padding: '4px 8px', fontSize: '11px', borderColor: 'var(--error)', color: 'var(--error)' }}
                                    onClick={() => handleDeleteCoupon(c.code)}
                                  >
                                    Excluir
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab: Suporte */}
            {adminTab === 'suporte' && (
              <div className="panel-card">
                <div className="panel-header secondary">
                  <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.15)', color: 'var(--primary)' }}>💬</div>
                  <div className="panel-header-info">
                    <h2>Gerenciamento de Tickets de Suporte</h2>
                    <p>Responda chamados de clientes ou altere seus status</p>
                  </div>
                </div>

                {selectedTicketId === null ? (
                  <div className="services-table-wrapper" style={{ marginTop: '20px' }}>
                    <table className="smm-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Cliente</th>
                          <th>Assunto</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px' }}>
                              Nenhum ticket registrado no painel.
                            </td>
                          </tr>
                        ) : (
                          tickets.map((t) => {
                            const statusMap = {
                              aberto: { text: 'Aberto', class: 'pending' },
                              respondido: { text: 'Respondido', class: 'success' },
                              fechado: { text: 'Fechado', class: 'disabled' }
                            };
                            const statusInfo = statusMap[t.status] || { text: t.status, class: 'pending' };

                            return (
                              <tr key={t.id}>
                                <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                  {new Date(t.createdAt).toLocaleString('pt-BR')}
                                </td>
                                <td style={{ fontWeight: '500' }}>{t.userEmail}</td>
                                <td>{t.subject}</td>
                                <td>
                                  <span className={`badge ${statusInfo.class}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                                    {statusInfo.text}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="copy-btn"
                                    style={{ margin: 0, padding: '6px 12px', fontSize: '12px' }}
                                    onClick={() => setSelectedTicketId(t.id)}
                                  >
                                    Visualizar / Responder
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Admin chat thread
                  <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {(() => {
                      const currentTicket = tickets.find(t => t.id === selectedTicketId);
                      if (!currentTicket) {
                        return (
                          <div>
                            <p>Ticket não encontrado.</p>
                            <button className="copy-btn" onClick={() => setSelectedTicketId(null)}>Voltar</button>
                          </div>
                        );
                      }

                      const statusMap = {
                        aberto: { text: 'Aberto', class: 'pending' },
                        respondido: { text: 'Respondido', class: 'success' },
                        fechado: { text: 'Fechado', class: 'disabled' }
                      };
                      const statusInfo = statusMap[currentTicket.status] || { text: currentTicket.status, class: 'pending' };

                      return (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <button 
                                className="copy-btn" 
                                style={{ margin: '0 12px 0 0', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => setSelectedTicketId(null)}
                              >
                                ← Voltar
                              </button>
                              <h3 style={{ display: 'inline-block', fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                {currentTicket.subject} (Cliente: {currentTicket.userEmail})
                              </h3>
                              <span className={`badge ${statusInfo.class}`} style={{ marginLeft: '12px', padding: '4px 8px', fontSize: '11px' }}>
                                {statusInfo.text}
                              </span>
                            </div>
                            {currentTicket.status !== 'fechado' && (
                              <button 
                                className="copy-btn" 
                                style={{ margin: 0, padding: '6px 12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                                onClick={() => handleCloseTicket(currentTicket.id)}
                              >
                                Fechar Ticket
                              </button>
                            )}
                          </div>

                          {/* Chat messages */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '12px', 
                            maxHeight: '400px', 
                            overflowY: 'auto', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            backgroundColor: 'var(--bg-tertiary)',
                            border: '1px solid var(--border-color)' 
                          }}>
                            {selectedTicketMessages.length === 0 ? (
                              <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhuma mensagem.</p>
                            ) : (
                              selectedTicketMessages.map((msg) => {
                                const isAdmin = msg.sender === 'admin';
                                return (
                                  <div 
                                    key={msg.id} 
                                    style={{ 
                                      alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                                      maxWidth: '75%',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      alignItems: isAdmin ? 'flex-end' : 'flex-start'
                                    }}
                                  >
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', padding: '0 4px' }}>
                                      {isAdmin ? 'Você (Admin)' : `Cliente (${currentTicket.userEmail})`}
                                    </span>
                                    <div style={{ 
                                      padding: '12px 16px', 
                                      borderRadius: '16px', 
                                      borderTopLeftRadius: isAdmin ? '16px' : '4px',
                                      borderTopRightRadius: isAdmin ? '4px' : '16px',
                                      backgroundColor: isAdmin ? 'var(--primary)' : 'var(--bg-card)',
                                      color: isAdmin ? 'white' : 'var(--text-primary)',
                                      border: isAdmin ? 'none' : '1px solid var(--border-color)',
                                      fontSize: '14px',
                                      lineHeight: '1.5',
                                      wordBreak: 'break-word'
                                    }}>
                                      {msg.message}
                                    </div>
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px', padding: '0 4px' }}>
                                      {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Reply Form */}
                          {currentTicket.status === 'fechado' ? (
                            <div className="payment-status-banner pending" style={{ margin: 0, textAlign: 'center' }}>
                              Este chamado está encerrado. Se necessário, reabra ou oriente o cliente a abrir outro.
                            </div>
                          ) : (
                            <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '12px' }}>
                              <input 
                                type="text" 
                                className="form-input" 
                                placeholder="Digite sua resposta administrativa..." 
                                value={ticketReply}
                                onChange={(e) => setTicketReply(e.target.value)}
                                required
                                style={{ flexGrow: 1 }}
                              />
                              <button type="submit" className="payment-btn" style={{ margin: 0, padding: '0 24px', flexShrink: 0 }}>
                                Enviar Resposta
                              </button>
                            </form>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'perfil' && (
          <div className="panel-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="panel-header">
              <div className="panel-header-icon">👤</div>
              <div className="panel-header-info">
                <h2>Configurações da Conta</h2>
                <p>Altere a senha da sua conta para manter seus dados seguros.</p>
              </div>
            </div>

            {changePasswordFeedback && (
              <div className={`payment-status-banner ${changePasswordFeedback.success ? 'approved' : 'pending'}`} style={{ marginBottom: '20px', justifyContent: 'center' }}>
                {changePasswordFeedback.message}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">E-mail da Conta</label>
                <input
                  type="text"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Sua senha atual"
                  value={changePasswordCurrent}
                  onChange={(e) => setChangePasswordCurrent(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={changePasswordNew}
                  onChange={(e) => setChangePasswordNew(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Repita a nova senha"
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" style={{ marginTop: '10px' }} disabled={changePasswordLoading}>
                {changePasswordLoading ? 'Alterando Senha...' : 'Alterar Senha'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Service Modal */}
      {serviceModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="panel-card" style={{ maxWidth: '600px', width: '100%', margin: 0, border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div className="panel-header">
              <div className="panel-header-icon" style={{ backgroundColor: 'rgba(108, 37, 226, 0.15)', color: 'var(--primary)' }}>
                {serviceModalMode === 'create' ? '➕' : '✏️'}
              </div>
              <div className="panel-header-info">
                <h2>{serviceModalMode === 'create' ? 'Adicionar Novo Serviço' : 'Editar Serviço'}</h2>
                <p>{serviceModalMode === 'create' ? 'Crie um serviço manual ou customizado' : 'Ajuste valores, preço e limites do serviço'}</p>
              </div>
            </div>

            <form onSubmit={handleServiceFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ID do Serviço</label>
                  <input
                    type="text"
                    className="form-input"
                    value={serviceFormId}
                    onChange={(e) => setServiceFormId(e.target.value)}
                    placeholder="Ex: 1050 ou cust_curtidas"
                    disabled={serviceModalMode === 'edit'}
                    required
                  />
                  <small style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>Use apenas números para serviços do provedor real.</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <input
                    type="text"
                    className="form-input"
                    value={serviceFormCategory}
                    onChange={(e) => setServiceFormCategory(e.target.value)}
                    placeholder="Ex: Instagram Curtidas"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nome do Serviço</label>
                <input
                  type="text"
                  className="form-input"
                  value={serviceFormName}
                  onChange={(e) => setServiceFormName(e.target.value)}
                  placeholder="Ex: Instagram Curtidas Brasileiras [Rápido]"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Preço por 1000 (R$)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={serviceFormRate}
                    onChange={(e) => setServiceFormRate(e.target.value)}
                    placeholder="Ex: 5.50"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Qtd Mínima</label>
                  <input
                    type="number"
                    className="form-input"
                    value={serviceFormMin}
                    onChange={(e) => setServiceFormMin(e.target.value)}
                    placeholder="Ex: 10"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Qtd Máxima</label>
                  <input
                    type="number"
                    className="form-input"
                    value={serviceFormMax}
                    onChange={(e) => setServiceFormMax(e.target.value)}
                    placeholder="Ex: 10000"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-input"
                  value={serviceFormDescription}
                  onChange={(e) => setServiceFormDescription(e.target.value)}
                  placeholder="Descrição do serviço e prazos de entrega..."
                  rows={3}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="copy-btn" 
                  style={{ margin: 0, backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  onClick={() => setServiceModalOpen(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  style={{ margin: 0, width: 'auto', padding: '10px 24px' }}
                  disabled={isSavingService}
                >
                  {isSavingService ? 'Salvando...' : 'Salvar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
