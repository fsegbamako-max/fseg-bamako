import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { admApi } from '../../services/api';
import PublicationManager from '../../components/admin/PublicationManager';

export default function AdminCours() {
  const { data: classes } = useQuery({ queryKey: ['admin-classes'], queryFn: () => admApi.getClasses().then(r => r.data.data) });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-fseg-green" />
        <h1 className="text-2xl font-bold text-gray-900">Cours</h1>
      </div>
      <PublicationManager
        queryKey="admin-cours"
        fetchFn={params => admApi.getCours(params)}
        createFn={form  => admApi.createCours(form)}
        updateFn={(id, d) => admApi.updateCours(id, d)}
        deleteFn={id    => admApi.deleteCours(id)}
        addFilesFn={(id, f) => admApi.addFilesCours(id, f)}
        deleteFileFn={fileId => admApi.deleteFileCours(fileId)}
        classes={classes || []}
        entityLabel="cours"
        fileOptions={{ accept: '.pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.mov,.jpg,.png,.webp,*' }}
      />
    </div>
  );
}
