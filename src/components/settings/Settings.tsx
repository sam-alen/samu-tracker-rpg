import { useState, useRef } from 'react';
import { User, Download, Upload, Trash2, Save, Image } from 'lucide-react';
import { Card, SectionHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { storage } from '../../lib/storage';
import type { Profile } from '../../types';

export function Settings() {
  const [profile, setProfile] = useLocalStorage<Profile>(storage.keys.profile, storage.getProfile());
  const [form, setForm] = useState<Profile>(profile);
  const [saved, setSaved] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  function saveProfile() {
    setProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportData() {
    const json = storage.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `samu-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        storage.importAll(ev.target?.result as string);
        window.location.reload();
      } catch {
        alert('El archivo no es válido.');
      }
    };
    reader.readAsText(file);
  }

  function clearAll() {
    storage.clearAll();
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Configuración" subtitle="Personaliza tu perfil y gestiona los datos" />

      {/* Profile */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <User size={16} className="text-gold-300" />
          <p className="text-sm font-medium text-white">Perfil de usuario</p>
        </div>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-xl border-2 border-[#2B4066] overflow-hidden bg-[#04060B] flex items-center justify-center shrink-0">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <Image size={24} className="text-gray-600" />
            )}
          </div>
          <div className="flex-1">
            <Input
              label="URL del avatar"
              value={form.avatarUrl}
              onChange={e => setForm(p => ({ ...p, avatarUrl: e.target.value }))}
              placeholder="https://... o ruta local /avatar.png"
            />
            <p className="text-xs text-gray-600 mt-1">Pega aquí la URL de tu imagen generada por IA</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Tu nombre"
          />
          <Input
            label="Título RPG"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="Developer en entrenamiento"
          />
          <Input
            label="Meta principal"
            value={form.mainGoal}
            onChange={e => setForm(p => ({ ...p, mainGoal: e.target.value }))}
            placeholder="Certificarme en Salesforce"
          />
          <Select
            label="Color de acento"
            value={form.accentColor}
            onChange={e => setForm(p => ({ ...p, accentColor: e.target.value as Profile['accentColor'] }))}
            options={[
              { value: 'blue', label: 'Azul eléctrico' },
              { value: 'purple', label: 'Morado' },
              { value: 'gold', label: 'Dorado' },
            ]}
          />
        </div>

        <Button variant="primary" fullWidth className="mt-5" onClick={saveProfile}>
          <Save size={14} className="inline mr-1.5" />
          {saved ? '¡Guardado!' : 'Guardar perfil'}
        </Button>
      </Card>

      {/* Data management */}
      <Card>
        <p className="text-sm font-medium text-white mb-4">Gestión de datos</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#04060B] border border-[#1B2A47]">
            <Download size={16} className="text-arcane-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-200">Exportar datos</p>
              <p className="text-xs text-gray-500 mt-0.5">Descarga todos tus datos en un archivo JSON</p>
            </div>
            <Button variant="secondary" size="sm" onClick={exportData}>Exportar</Button>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#04060B] border border-[#1B2A47]">
            <Upload size={16} className="text-emerald-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-200">Importar datos</p>
              <p className="text-xs text-gray-500 mt-0.5">Restaura desde un archivo de respaldo JSON</p>
            </div>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={importData} />
            <Button variant="secondary" size="sm" onClick={() => importRef.current?.click()}>Importar</Button>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-950/20 border border-red-900/30">
            <Trash2 size={16} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-300">Limpiar todos los datos</p>
              <p className="text-xs text-red-900/70 mt-0.5 text-red-400/60">Esta acción no se puede deshacer</p>
            </div>
            {!confirmClear ? (
              <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>Limpiar</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmClear(false)}>No</Button>
                <Button variant="danger" size="sm" onClick={clearAll}>Confirmar</Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <p className="text-sm font-medium text-white mb-2">Acerca de</p>
        <p className="text-xs text-gray-500">Samu Tracker RPG v1.0</p>
        <p className="text-xs text-gray-600 mt-1">App personal · Solo uso en localStorage · Sin backend</p>
        <div className="mt-3 p-3 rounded-lg bg-arcane-900/25 border border-arcane-700/30">
          <p className="text-xs text-arcane-200/80">Todas las claves en localStorage comienzan con <code className="text-gold-200 bg-gold-900/40 px-1 rounded">rpg_</code></p>
        </div>
      </Card>
    </div>
  );
}
