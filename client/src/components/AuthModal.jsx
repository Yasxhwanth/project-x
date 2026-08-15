import React, { useState } from 'react';
import { 
  Modal, 
  TextInput, 
  Button, 
  InlineNotification,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Select,
  SelectItem,
  Tag
} from '@carbon/react';
import { User, Enterprise, Login, UserFollow, Mobile, Locked, ArrowRight } from '@carbon/icons-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState(0);

  // OTP Form State
  const [otpEmail, setOtpEmail] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [otpCode, setOtpCode] = useState('');
  const [devOtpHint, setDevOtpHint] = useState(null);

  // Password Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regPlan, setRegPlan] = useState('Enterprise Plan');
  const [regRole, setRegRole] = useState('Brand Admin');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const saveTokenAndNotify = (data) => {
    if (data.token) {
      localStorage.setItem('cc_token', data.token);
    }
    onAuthSuccess(data);
    onClose();
  };

  // ── OTP Authentication Handlers ──────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setOtpStep(2);
      if (data.devOtp) {
        setDevOtpHint(data.devOtp);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, code: otpCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      saveTokenAndNotify(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth Handler ──────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const gEmail = otpEmail.includes('@') ? otpEmail : (loginEmail.includes('@') ? loginEmail : 'demo.user@company.com');
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: gEmail,
          name: gEmail.split('@')[0].replace('.', ' '),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
          googleId: `google_${Date.now()}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Google Auth failed");

      saveTokenAndNotify(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Password Login & Registration ─────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      saveTokenAndNotify(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          organizationName: regOrgName,
          plan: regPlan,
          role: regRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      saveTokenAndNotify(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onRequestClose={onClose}
      modalHeading="Workspace Authentication"
      modalLabel="Project X (Secure Token Auth)"
      passiveModal
      size="sm"
    >
      <div style={{ padding: '0.5rem 0', color: '#ffffff' }}>
        {errorMsg && (
          <InlineNotification
            kind="error"
            title="Authentication Error"
            subtitle={errorMsg}
            style={{ marginBottom: '1rem' }}
          />
        )}

        {/* Google One-Tap Quick Login Button */}
        <div style={{ marginBottom: '1.25rem' }}>
          <Button
            kind="tertiary"
            size="md"
            renderIcon={User}
            onClick={handleGoogleLogin}
            style={{ width: '100%', justifyContent: 'center', background: '#262626', borderColor: '#393939' }}
          >
            Continue with Google OAuth
          </Button>
          <div style={{ textAlign: 'center', margin: '0.75rem 0', color: '#6f6f6f', fontSize: '0.8rem' }}>
            ────── OR USE SECURE AUTH ──────
          </div>
        </div>

        <Tabs selectedIndex={activeTab} onChange={({ selectedIndex }) => setActiveTab(selectedIndex)}>
          <TabList aria-label="Auth Tabs" style={{ marginBottom: '1rem' }}>
            <Tab renderIcon={Mobile}>6-Digit OTP Login</Tab>
            <Tab renderIcon={Login}>Password Login</Tab>
            <Tab renderIcon={UserFollow}>New Organization</Tab>
          </TabList>

          <TabPanels>
            {/* Tab 0: Email / Mobile OTP Login */}
            <TabPanel>
              {otpStep === 1 ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <TextInput
                    id="otp-email-input"
                    labelText="Email Address or Mobile Number"
                    placeholder="e.g. user@company.com or 9876543210"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    helperText="We will send a 6-digit verification code to your email."
                    required
                  />
                  <Button type="submit" renderIcon={ArrowRight} disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send 6-Digit Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {devOtpHint && (
                    <InlineNotification
                      kind="info"
                      title="Demo OTP Code"
                      subtitle={`Your 6-digit verification code is: ${devOtpHint}`}
                    />
                  )}
                  <TextInput
                    id="otp-code-input"
                    labelText={`Enter Code Sent to ${otpEmail}`}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button type="submit" renderIcon={Locked} disabled={loading} style={{ flex: 1 }}>
                      {loading ? 'Verifying...' : 'Verify OTP & Log In'}
                    </Button>
                    <Button kind="secondary" onClick={() => setOtpStep(1)}>
                      Resend
                    </Button>
                  </div>
                </form>
              )}
            </TabPanel>

            {/* Tab 1: Password Login */}
            <TabPanel>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextInput
                  id="login-email"
                  labelText="Email Address"
                  placeholder="e.g. name@company.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <TextInput
                  id="login-password"
                  labelText="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <Button type="submit" renderIcon={Login} disabled={loading}>
                  {loading ? 'Authenticating...' : 'Sign In with Password'}
                </Button>
              </form>
            </TabPanel>

            {/* Tab 2: New Organization Registration */}
            <TabPanel>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <TextInput
                  id="reg-name"
                  labelText="Your Full Name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
                <TextInput
                  id="reg-email"
                  labelText="Work Email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. rahul@brand.com"
                  required
                />
                <TextInput
                  id="reg-org"
                  labelText="Brand / Organization Name"
                  value={regOrgName}
                  onChange={(e) => setRegOrgName(e.target.value)}
                  placeholder="e.g. Acme Performance D2C"
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <Select
                    id="reg-role"
                    labelText="Workspace Role"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                  >
                    <SelectItem value="Brand Admin" text="Brand Admin" />
                    <SelectItem value="Agency Admin" text="Agency Admin" />
                    <SelectItem value="Creator" text="Creator" />
                  </Select>

                  <Select
                    id="reg-plan"
                    labelText="Select Plan"
                    value={regPlan}
                    onChange={(e) => setRegPlan(e.target.value)}
                  >
                    <SelectItem value="Enterprise Plan" text="Enterprise" />
                    <SelectItem value="Pro Plan" text="Pro (₹25K/mo)" />
                  </Select>
                </div>
                <TextInput
                  id="reg-password"
                  labelText="Set Password"
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
                <Button type="submit" renderIcon={UserFollow} disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Workspace & Sign In'}
                </Button>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Modal>
  );
}
