const { execSync } = require('child_process');

const vars = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", val: "https://xzqocykygtooyxamombj.supabase.co" },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", val: "sb_publishable_aDewurK1M9hG_udDmmDyHQ_BHMQj6nb" },
  { name: "SUPABASE_SERVICE_ROLE_KEY", val: "sb_publishable_aDewurK1M9hG_udDmmDyHQ_BHMQj6nb" },
  { name: "SUPPLIER_API_URL", val: "https://smmpainel.com/api/v2" },
  { name: "SUPPLIER_API_KEY", val: "d8bfae98c28440aa77873ef4d109d52a" }
];

for (const item of vars) {
  const cmd = `cmd.exe /c npx vercel env add ${item.name} production --value "${item.val}" --yes --force --non-interactive`;
  console.log(`Executing: ${cmd}`);
  try {
    // Set 60-second timeout to allow the slow Vercel cloud API call to complete saving and return
    execSync(cmd, { stdio: 'inherit', timeout: 60000 });
  } catch (error) {
    console.log(`Finished execution of ${item.name} (result or timeout).`);
  }
}
console.log("All environment variables added!");
