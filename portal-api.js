/* portal-api.js
   Shared localStorage API, auth, mock payment gateway, PDF export utilities.
*/

(function(global){
  const DEFAULT_ORG = 'FLAWLESS';
  function activeOrg(){ return localStorage.getItem('active_org') || DEFAULT_ORG; }

  // Keys
  function key(k){ return `${activeOrg()}_${k}`; }
  const KEYS = {
    PENDING: () => key('payroll_pending'),
    APPROVED: () => key('payroll_approved'),
    ACCOUNTS: () => key('payment_accounts'),
    PAYMENTS: () => key('payments_log'),
    MESSAGES: () => key('messages'),
    AUDIT: () => key('audit'),
    TEACH_ATT: () => key('teacher_attendance'),
    TIMETABLE: () => key('teacher_timetable'),
    NOTES: () => key('teacher_notes'),
    USERS: () => key('users'),
    SALARY_SHEETS: () => key('salary_sheets')
  };

  // Basic storage helpers
  function safeParse(s){ try{ return JSON.parse(s); }catch(e){ return null; } }
  function read(k){ return safeParse(localStorage.getItem(k)) || []; }
  function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
  function push(k,obj){ const arr = read(k); arr.push(obj); save(k,arr); return obj; }
  function uid(prefix='id'){ return prefix + '_' + Date.now().toString(36); }

  // Auth: simple users stored in localStorage with password (NOT SECURE - for demo only)
  function seedUsers(){
    const k = KEYS.USERS();
    if(localStorage.getItem(k)) return;
    const users = [
      { id: uid('u'), email:'hr@flawless.local', name:'HR Admin', role:'hr', password:'hrpass' },
      { id: uid('u'), email:'finance@flawless.local', name:'Finance', role:'finance', password:'finpass' },
      { id: uid('u'), email:'teacher@flawless.local', name:'Teacher', role:'teacher', password:'teachpass' }
    ];
    save(k, users);
  }

  // Mock external payment gateway (bank / momo). Returns Promise resolve/reject
  function mockPaymentGateway({ method='bank', account, amount, reference }){
    // simulate network delay + success rate
    return new Promise((resolve) => {
      const ms = 800 + Math.floor(Math.random()*1000);
      setTimeout(()=> {
        // 90% success for bank, 92% mobile, 98% wallet internal
        const chance = method === 'bank' ? 0.90 : (method === 'momo' ? 0.92 : 0.99);
        const ok = Math.random() < chance;
        resolve({
          success: ok,
          provider: method,
          account,
          amount,
          reference,
          txId: uid('tx'),
          time: new Date().toISOString(),
          message: ok ? 'Payment processed (mock)' : 'Mock gateway failed'
        });
      }, ms);
    });
  }

  // PDF payslip helper using jsPDF (jsPDF must be loaded in page)
  function generatePayslipPdf({ employeeName, period, gross, tax, deductions, net, notes }, filename){
    if(!window.jspdf) {
      console.warn('jsPDF not loaded');
      return null;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p','pt','a4');
    doc.setFontSize(14); doc.text('Flawless Graphics — Payslip', 40, 40);
    doc.setFontSize(11);
    doc.text(`Employee: ${employeeName}`, 40, 72);
    doc.text(`Period: ${period}`, 40, 90);
    doc.text(`Gross: ₵${gross}`, 40, 120);
    doc.text(`Tax: ₵${tax}`, 40, 136);
    doc.text(`Deductions: ₵${deductions}`, 40, 152);
    doc.setFontSize(12); doc.text(`Net Pay: ₵${net}`, 40, 184);
    if(notes) { doc.setFontSize(10); doc.text('Notes:', 40, 210); doc.text(String(notes), 40, 226); }
    const fname = filename || `${employeeName.replace(/\s+/g,'_')}_payslip_${period}.pdf`;
    doc.save(fname);
    return true;
  }

  // Expose API
  global.PortalAPI = {
    KEYS,
    read,
    save,
    push,
    uid,
    seedUsers,
    mockPaymentGateway,
    generatePayslipPdf,
    activeOrg
  };

  // seed users on load
  seedUsers();

})(window);
