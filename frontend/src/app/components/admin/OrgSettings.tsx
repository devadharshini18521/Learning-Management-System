import { useState, useEffect } from 'react';
import { settingsAPI } from '../../../services/api';
import { Settings, Save, Upload, Globe, GraduationCap, Award, Trophy, Mail, Shield, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

export default function OrgSettings() {
  const [settings, setSettings] = useState({
    organization: {
      name: '',
      logo: null as string | null,
      favicon: null as string | null,
      primaryColor: '#6366f1',
      secondaryColor: '#8b5cf6'
    },
    email: {
      fromName: 'Zoho Learning',
      fromEmail: 'noreply@zoholearning.com',
      enableNotifications: true
    },
    features: {
      enableCertificates: true,
      enableKnowledgeBase: true,
      enableAssessments: true,
      enableDiscussions: false
    },
    security: {
      passwordMinLength: 6,
      sessionTimeout: 60,
      maxLoginAttempts: 5
    },
    learningPolicies: {
      requireCourseApproval: false,
      allowSelfEnrollment: true,
      defaultCourseVisibility: 'public',
      certificateValidity: 0,
      requireAssessmentPassing: true,
      assessmentPassingScore: 70,
      enableGamification: false,
      showLeaderboard: false
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.get();
      if (response.settings) {
        const settingsData = response.settings;
        setSettings(prev => ({
          ...prev,
          ...settingsData,
          organization: {
            ...prev.organization,
            ...(settingsData.organization || {})
          },
          email: {
            ...prev.email,
            ...(settingsData.email || {})
          },
          features: {
            ...prev.features,
            ...(settingsData.features || {})
          },
          security: {
            ...prev.security,
            ...(settingsData.security || {})
          },
          learningPolicies: {
            ...prev.learningPolicies,
            ...(settingsData.learningPolicies || {})
          }
        }));
        if (settingsData.organization?.logo) {
          setLogoPreview(settingsData.organization.logo);
        }
        if (settingsData.organization?.favicon) {
          setFaviconPreview(settingsData.organization.favicon);
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err as Error);
      toast.error('Failed to load settings. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo file size must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Immediate UI update
        setLogoPreview(base64);
        setSettings(prev => ({
          ...prev,
          organization: { ...prev.organization, logo: base64 }
        }));
        setHasChanges(true);
        toast.success('Logo loaded! Click Save to apply changes.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Favicon file size must be less than 1MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Immediate UI update
        setFaviconPreview(base64);
        setSettings(prev => ({
          ...prev,
          organization: { ...prev.organization, favicon: base64 }
        }));
        setHasChanges(true);
        toast.success('Favicon loaded! Click Save to apply changes.');
      };
      reader.readAsDataURL(file);
    }
  };

  const validateSettings = () => {
    const errors: string[] = [];
    
    if (!settings.organization.name.trim()) {
      errors.push('Organization name is required');
    }
    
    if (settings.organization.name.length > 100) {
      errors.push('Organization name must be less than 100 characters');
    }
    
    if (settings.email.fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email.fromEmail)) {
      errors.push('Please enter a valid from email address');
    }
    
    if (settings.security.passwordMinLength < 4 || settings.security.passwordMinLength > 32) {
      errors.push('Password minimum length must be between 4 and 32');
    }
    
    if (settings.security.sessionTimeout < 5 || settings.security.sessionTimeout > 480) {
      errors.push('Session timeout must be between 5 and 480 minutes');
    }
    
    if (settings.security.maxLoginAttempts < 1 || settings.security.maxLoginAttempts > 10) {
      errors.push('Max login attempts must be between 1 and 10');
    }
    
    if (settings.learningPolicies.assessmentPassingScore < 0 || settings.learningPolicies.assessmentPassingScore > 100) {
      errors.push('Assessment passing score must be between 0 and 100');
    }
    
    if (settings.learningPolicies.certificateValidity < 0) {
      errors.push('Certificate validity cannot be negative');
    }
    
    return errors;
  };

  const handleSave = async () => {
    const errors = validateSettings();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    setSaving(true);
    // Optimistic update - show saving immediately
    toast.info('Saving settings...', { duration: 1000 });
    
    try {
      const response = await settingsAPI.update(settings);
      if (response.success) {
        toast.success('Settings saved successfully!');
        setHasChanges(false);
        // Update with server response to ensure sync
        if (response.settings) {
          setSettings(prev => ({
            ...prev,
            ...response.settings
          }));
          // Update previews immediately
          if (response.settings.organization?.logo) {
            setLogoPreview(response.settings.organization.logo);
          }
          if (response.settings.organization?.favicon) {
            setFaviconPreview(response.settings.organization.favicon);
          }
        }
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error((err as Error).message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (hasChanges && !window.confirm('Are you sure you want to discard your changes?')) {
      return;
    }
    // Immediate reset
    setLogoPreview(null);
    setFaviconPreview(null);
    fetchSettings();
    setHasChanges(false);
    toast.info('Settings reset to saved values');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white flex items-center gap-2">
          <Settings className="w-6 h-6 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Organization Settings</h2>
          <p className="text-indigo-300 mt-1">Configure your LMS branding and policies</p>
          {hasChanges && (
            <p className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              You have unsaved changes
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button 
              onClick={handleReset} 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              disabled={saving}
            >
              Reset
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
            disabled={saving}
          >
            {saving ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Organization Branding */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Organization Branding
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">Organization Name</Label>
            <Input
              value={settings.organization?.name || ''}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  organization: { ...prev.organization, name: e.target.value }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
              placeholder="Enter organization name"
              maxLength={100}
            />
            <p className="text-indigo-300 text-xs mt-1">
              {settings.organization?.name?.length || 0}/100 characters
            </p>
          </div>
          
          <div>
            <Label className="text-white mb-2 block">Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/10">
                  <img src={logoPreview} alt="Organization Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-indigo-400" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                />
                <p className="text-indigo-300 text-xs mt-1">Recommended: 200x50px PNG or JPG (max 2MB)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">Favicon</Label>
            <div className="flex items-center gap-4">
              {faviconPreview ? (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/10">
                  <img src={faviconPreview} alt="Favicon" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-indigo-400" />
                </div>
              )}
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFaviconUpload}
                  className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                />
                <p className="text-indigo-300 text-xs mt-1">Recommended: 32x32px or 64x64px PNG/ICO (max 1MB)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">Primary Color (Theme)</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={settings.organization?.primaryColor || '#6366f1'}
                onChange={(e) => {
                  setSettings(prev => ({
                    ...prev,
                    organization: { ...prev.organization, primaryColor: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="w-14 h-10 bg-white/10 border-white/20 p-1"
              />
              <Input
                type="text"
                value={settings.organization?.primaryColor || '#6366f1'}
                onChange={(e) => {
                  setSettings(prev => ({
                    ...prev,
                    organization: { ...prev.organization, primaryColor: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="bg-white/10 border-white/20 text-white flex-1"
              />
            </div>
          </div>
          <div>
            <Label className="text-white mb-2 block">Secondary Color</Label>
            <div className="flex items-center gap-3">
              <Input
                type="color"
                value={settings.organization?.secondaryColor || '#8b5cf6'}
                onChange={(e) => {
                  setSettings(prev => ({
                    ...prev,
                    organization: { ...prev.organization, secondaryColor: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="w-14 h-10 bg-white/10 border-white/20 p-1"
              />
              <Input
                type="text"
                value={settings.organization?.secondaryColor || '#8b5cf6'}
                onChange={(e) => {
                  setSettings(prev => ({
                    ...prev,
                    organization: { ...prev.organization, secondaryColor: e.target.value }
                  }));
                  setHasChanges(true);
                }}
                className="bg-white/10 border-white/20 text-white flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">From Name</Label>
            <Input
              value={settings.email?.fromName || ''}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, fromName: e.target.value }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
              placeholder="e.g., Zoho Learning"
            />
          </div>
          
          <div>
            <Label className="text-white mb-2 block">From Email</Label>
            <Input
              type="email"
              value={settings.email?.fromEmail || ''}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, fromEmail: e.target.value }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
              placeholder="e.g., noreply@zoholearning.com"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
          <div>
            <p className="text-white font-medium">Enable Email Notifications</p>
            <p className="text-indigo-300 text-sm">Send email notifications to users</p>
          </div>
          <Switch
            checked={settings.email?.enableNotifications}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                email: { ...prev.email, enableNotifications: checked }
              }));
              setHasChanges(true);
            }}
          />
        </div>
      </div>

      {/* Learning Policies */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="w-5 h-5" />
          Learning Policies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Require Course Approval</p>
              <p className="text-indigo-300 text-sm">Admin must approve courses before publishing</p>
            </div>
          <Switch
            checked={settings.learningPolicies?.requireCourseApproval}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                learningPolicies: { ...prev.learningPolicies, requireCourseApproval: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Allow Self Enrollment</p>
              <p className="text-indigo-300 text-sm">Users can enroll in courses without approval</p>
            </div>
          <Switch
            checked={settings.learningPolicies?.allowSelfEnrollment}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                learningPolicies: { ...prev.learningPolicies, allowSelfEnrollment: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label className="text-white mb-2 block">Default Course Visibility</Label>
            <Select
              value={settings.learningPolicies?.defaultCourseVisibility || 'public'}
              onValueChange={(value: string) => {
                setSettings(prev => ({
                  ...prev,
                  learningPolicies: { ...prev.learningPolicies, defaultCourseVisibility: value }
                }));
                setHasChanges(true);
              }}
            >
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public - Visible to all users</SelectItem>
                <SelectItem value="private">Private - Visible to enrolled users only</SelectItem>
                <SelectItem value="hidden">Hidden - Only visible to creators</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white mb-2 block">Certificate Validity (months)</Label>
            <Input
              type="number"
              min={0}
              value={settings.learningPolicies?.certificateValidity || 0}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  learningPolicies: { ...prev.learningPolicies, certificateValidity: parseInt(e.target.value) || 0 }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
              placeholder="0 = Lifetime"
            />
            <p className="text-indigo-300 text-xs mt-1">Enter 0 for lifetime validity</p>
          </div>
        </div>
      </div>

      {/* Assessment Policies */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Award className="w-5 h-5" />
          Assessment & Certification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Require Assessment Passing</p>
              <p className="text-indigo-300 text-sm">Users must pass assessments to complete courses</p>
            </div>
          <Switch
            checked={settings.learningPolicies?.requireAssessmentPassing}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                learningPolicies: { ...prev.learningPolicies, requireAssessmentPassing: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>

          <div>
            <Label className="text-white mb-2 block">Passing Score (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={settings.learningPolicies?.assessmentPassingScore || 70}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  learningPolicies: { ...prev.learningPolicies, assessmentPassingScore: parseInt(e.target.value) || 70 }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
      </div>

      {/* Gamification */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Gamification
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Gamification</p>
              <p className="text-indigo-300 text-sm">Award points and badges for achievements</p>
            </div>
          <Switch
            checked={settings.learningPolicies?.enableGamification}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                learningPolicies: { ...prev.learningPolicies, enableGamification: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Show Leaderboard</p>
              <p className="text-indigo-300 text-sm">Display top learners on dashboard</p>
            </div>
          <Switch
            checked={settings.learningPolicies?.showLeaderboard}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                learningPolicies: { ...prev.learningPolicies, showLeaderboard: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Features
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Certificates</p>
              <p className="text-indigo-300 text-sm">Allow users to earn certificates</p>
            </div>
          <Switch
            checked={settings.features?.enableCertificates}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                features: { ...prev.features, enableCertificates: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Knowledge Base</p>
              <p className="text-indigo-300 text-sm">Show knowledge base section</p>
            </div>
          <Switch
            checked={settings.features?.enableKnowledgeBase}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                features: { ...prev.features, enableKnowledgeBase: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Assessments</p>
              <p className="text-indigo-300 text-sm">Allow quizzes and tests</p>
            </div>
          <Switch
            checked={settings.features?.enableAssessments}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                features: { ...prev.features, enableAssessments: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div>
              <p className="text-white font-medium">Enable Discussions</p>
              <p className="text-indigo-300 text-sm">Allow course discussions and comments</p>
            </div>
          <Switch
            checked={settings.features?.enableDiscussions}
            onCheckedChange={(checked: boolean) => {
              setSettings(prev => ({
                ...prev,
                features: { ...prev.features, enableDiscussions: checked }
              }));
              setHasChanges(true);
            }}
          />

          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label className="text-white mb-2 block">Min Password Length</Label>
            <Input
              type="number"
              min={4}
              max={32}
              value={settings.security?.passwordMinLength || 6}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, passwordMinLength: parseInt(e.target.value) || 6 }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Session Timeout (min)</Label>
            <Input
              type="number"
              min={5}
              max={480}
              value={settings.security?.sessionTimeout || 60}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, sessionTimeout: parseInt(e.target.value) || 60 }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
          <div>
            <Label className="text-white mb-2 block">Max Login Attempts</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.security?.maxLoginAttempts || 5}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  security: { ...prev.security, maxLoginAttempts: parseInt(e.target.value) || 5 }
                }));
                setHasChanges(true);
              }}
              className="bg-white/10 border-white/20 text-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
