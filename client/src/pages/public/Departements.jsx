export default function Departements() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-fseg-green mb-6">Départements</h2>
      <ul className="space-y-3 text-gray-700">
        <li className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl shadow-sm">
          <span className="font-medium">Département d'Économie</span>
          <span className="text-xs text-gray-400 italic">Page en construction</span>
        </li>
        <li className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl shadow-sm">
          <span className="font-medium">Département de Gestion</span>
          <span className="text-xs text-gray-400 italic">Page en construction</span>
        </li>
        <li className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl shadow-sm">
          <span className="font-medium">Département AQPE</span>
          <span className="text-xs text-gray-400 italic">Page en construction</span>
        </li>
      </ul>
    </section>
  );
}
