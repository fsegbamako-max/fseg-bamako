import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Pencil, Trash2, Upload, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { admApi } from '../../services/api';
import { toast } from '../../store/toastStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';

function fileName(url) {
  return url?.split('/').pop()?.split('?')[0].replace(/^\d+_/, '') || 'Fichier';
}

export default function AdminDocuments() {
  const [modal, setModal] = useState(null);
  const [expanded, setExpanded] = useState({});
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: () => admApi.getDocuments().then(r => r.data.data)
  });

  async function removePublication(id) {
    if (!window.confirm('Supprimer cette publication et ses fichiers ?')) return;
    try {
      await admApi.deleteDocument(id);
      queryClient.invalidateQueries(['admin-documents']);
      toast.success('Publication supprimée');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  }

  async function removeFile(id) {
    if (!window.confirm('Supprimer ce fichier ?')) return;
    try {
      await admApi.deleteFileDocument(id);
      queryClient.invalidateQueries(['admin-documents']);
      toast.success('Fichier supprimé');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-fseg-green" />
          <h1 className="text-2xl font-bold text-gray-900">Documents officiels</h1>
        </div>
        <Button onClick={() => setModal({ mode: 'create' })}>
          <Plus className="w-4 h-4" /> Nouvelle publication
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-16"><Spinner /></div>}

      <div className="space-y-3">
        {data?.map(pub => {
          const files = pub.fichiers_documents || [];
          const isOpen = !!expanded[pub.id];
          return (
            <div key={pub.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <button
                  onClick={() => setExpanded(v => ({ ...v, [pub.id]: !v[pub.id] }))}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-semibold text-sm text-gray-900">{pub.titre}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pub.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(pub.created_at).toLocaleDateString('fr-FR')} · {files.length} fichier(s)
                  </p>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setModal({ mode: 'edit', data: pub })}
                    className="p-1.5 text-gray-400 hover:text-fseg-green rounded-lg"
                    aria-label="Modifier"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removePublication(pub.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpanded(v => ({ ...v, [pub.id]: !v[pub.id] }))}
                    className="p-1.5 text-gray-400 rounded-lg"
                    aria-label="Afficher les fichiers"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <DocumentFiles
                  publication={pub}
                  onDelete={removeFile}
                  onRefresh={() => queryClient.invalidateQueries(['admin-documents'])}
                />
              )}
            </div>
          );
        })}
        {!isLoading && !data?.length && (
          <div className="text-center py-16 text-sm text-gray-400">Aucun document officiel</div>
        )}
      </div>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.mode === 'edit' ? 'Modifier la publication' : 'Nouvelle publication'}
      >
        <DocumentForm
          initial={modal?.data}
          mode={modal?.mode}
          onClose={() => setModal(null)}
        />
      </Modal>
    </div>
  );
}

function DocumentFiles({ publication, onDelete, onRefresh }) {
  const inputRef = useRef();
  const replaceRefs = useRef({});

  async function addFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const form = new FormData();
    files.forEach(file => form.append('fichiers', file));
    try {
      await admApi.addFilesDocument(publication.id, form);
      onRefresh();
      toast.success('Fichier(s) ajouté(s)');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur upload');
    } finally {
      event.target.value = '';
    }
  }

  async function replaceFile(fileId, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('nouveau_fichier', file);
    try {
      await admApi.updateFileDocument(fileId, form);
      onRefresh();
      toast.success('Fichier modifié');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur upload');
    } finally {
      event.target.value = '';
    }
  }

  return (
    <div className="border-t border-gray-50 px-4 pb-4 pt-3 space-y-2">
      {publication.fichiers_documents?.map(file => (
        <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
          <span className="flex-1 text-sm text-gray-700 truncate">{fileName(file.fichier)}</span>
          <a href={file.fichier} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-fseg-green">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={() => replaceRefs.current[file.id]?.click()}
            className="text-gray-400 hover:text-fseg-green"
            aria-label="Remplacer"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <input
            ref={node => { replaceRefs.current[file.id] = node; }}
            type="file"
            className="hidden"
            onChange={e => replaceFile(file.id, e)}
          />
          <button onClick={() => onDelete(file.id)} className="text-gray-400 hover:text-red-500" aria-label="Supprimer">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      <button onClick={() => inputRef.current?.click()} className="flex items-center gap-2 text-sm text-fseg-green hover:underline">
        <Upload className="w-3.5 h-3.5" /> Ajouter des fichiers
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={addFiles} />
    </div>
  );
}

function DocumentForm({ initial, mode, onClose }) {
  const { register, handleSubmit, formState: { errors } } = useForm({ defaultValues: initial });
  const fileRef = useRef();
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  async function submit(values) {
    setLoading(true);
    try {
      if (mode === 'edit') {
        await admApi.updateDocument(initial.id, {
          titre: values.titre,
          description: values.description
        });
      } else {
        const files = Array.from(fileRef.current?.files || []);
        if (!files.length) {
          toast.error('Sélectionnez au moins un fichier');
          return;
        }
        const form = new FormData();
        form.append('titre', values.titre);
        form.append('description', values.description);
        files.forEach(file => form.append('fichiers', file));
        await admApi.createDocument(form);
      }
      queryClient.invalidateQueries(['admin-documents']);
      toast.success(mode === 'edit' ? 'Publication modifiée' : 'Publication créée');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <Input
        label="Titre"
        placeholder="Titre du document"
        error={errors.titre?.message}
        {...register('titre', { required: 'Requis' })}
      />
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
        <textarea
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          {...register('description', { required: 'Requis' })}
        />
        {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>}
      </div>
      {mode === 'create' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">Fichiers</label>
          <input
            ref={fileRef}
            type="file"
            multiple
            required
            className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-fseg-light file:text-fseg-green file:font-medium cursor-pointer"
          />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onClose} className="flex-1">Annuler</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {mode === 'edit' ? 'Modifier' : 'Publier'}
        </Button>
      </div>
    </form>
  );
}