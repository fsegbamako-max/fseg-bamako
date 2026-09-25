import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'lucide-react';
import { admApi } from '../../services/api';
import PublicationManager from '../../components/admin/PublicationManager';

export default function AdminEmplois() {
  const { data: classes } = useQuery({ queryKey: ['admin-classes'], queryFn: () => admApi.getClasses().then(r => r.data.data) });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="w-5 h-5 text-fseg-green" />
        <h1 className="text-2xl font-bold text-gray-900">Emplois du temps</h1>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Le premier fichier d'une publication épinglée sera affiché en priorité aux étudiants.
      </p>
      <PublicationManager
        queryKey="admin-emplois"
        fetchFn={params => admApi.getEmplois(params)}
        createFn={form  => admApi.createEmploi(form)}
        updateFn={(id, d) => admApi.updateEmploi(id, d)}
        deleteFn={id    => admApi.deleteEmploi(id)}
        addFilesFn={(id, f) => admApi.addFilesEmploi(id, f)}
        deleteFileFn={fileId => admApi.deleteFileEmploi(fileId)}
        classes={classes || []}
        entityLabel="emploi du temps"
        fileOptions={{ accept: '.pdf,.jpg,.jpeg,.png,.webp,*', isPinnedOption: true }}
      />
    </div>
  );
}
