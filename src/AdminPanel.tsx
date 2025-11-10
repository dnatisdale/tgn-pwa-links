import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { isAdminUser } from './adminConfig';

type AdminSettings = {
  allowAddLinks: boolean;
  showQrTools: boolean;
  showExportButtons: boolean;
  showLanguageSidebar: boolean;
};

const DEFAULT_SETTINGS: AdminSettings = {
  allowAddLinks: true,
  showQrTools: true,
  showExportButtons: true,
  showLanguageSidebar: true,
};

export default function AdminPanel() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = isAdminUser(user?.email ?? null);

  // Gate: only admin allowed
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-600">Please sign in to access Admin.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <p className="text-gray-600">
          You are signed in as <strong>{user.email}</strong>, which is not an admin account.
        </p>
      </div>
    );
  }

  // Load admin settings from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const ref = doc(db, 'admin', 'uiSettings');
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data() as Partial<AdminSettings>;
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        } else {
          // first time: write defaults
          await setDoc(ref, DEFAULT_SETTINGS, { merge: true });
        }
      } catch (err) {
        console.error('Error loading admin settings', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const updateSetting = async (key: keyof AdminSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(true);
    try {
      const ref = doc(db, 'admin', 'uiSettings');
      await setDoc(ref, { [key]: value }, { merge: true });
    } catch (err) {
      console.error('Error saving admin setting', err);
      alert('Could not save setting. See console for details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Admin Controls</h1>
      <p className="text-sm text-gray-600 mb-4">
        Signed in as <strong>{user.email}</strong>. Only emails in <code>adminConfig.ts</code> can
        see this page. Use these switches to keep the normal user experience simple.
      </p>

      {loading ? (
        <p className="text-gray-600">Loading settings…</p>
      ) : (
        <div className="space-y-4">
          <AdminToggle
            label="Allow Add Links page"
            description="If off, normal users will not see the Add tab / Add form."
            checked={settings.allowAddLinks}
            onChange={(v) => updateSetting('allowAddLinks', v)}
          />
          <AdminToggle
            label="Show QR / PNG tools"
            description="Control whether normal users see the QR, Preview, Share / Download, and Copy PNG buttons."
            checked={settings.showQrTools}
            onChange={(v) => updateSetting('showQrTools', v)}
          />
          <AdminToggle
            label="Show Export buttons"
            description="Control whether normal users can export visible / selected links."
            checked={settings.showExportButtons}
            onChange={(v) => updateSetting('showExportButtons', v)}
          />
          <AdminToggle
            label="Show Language sidebar"
            description="If off, hides the Languages / ภาษา sidebar for normal users to simplify the layout."
            checked={settings.showLanguageSidebar}
            onChange={(v) => updateSetting('showLanguageSidebar', v)}
          />
        </div>
      )}

      {saving && <p className="mt-3 text-xs text-gray-500">Saving changes…</p>}

      <p className="mt-6 text-xs text-gray-500">
        Note: At this stage these flags are stored centrally in Firestore. In the next step we wire
        individual pages (AddLink, LinksList, etc.) to respect them for non-admin users.
      </p>
    </div>
  );
}

type AdminToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function AdminToggle({ label, description, checked, onChange }: AdminToggleProps) {
  return (
    <label className="flex items-start gap-3 p-3 rounded-xl border bg-gray-50 cursor-pointer">
      <div className="pt-1">
        <input
          type="checkbox"
          className="w-4 h-4"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
      <div>
        <div className="font-semibold text-sm">{label}</div>
        {description && <div className="text-xs text-gray-600">{description}</div>}
      </div>
    </label>
  );
}
