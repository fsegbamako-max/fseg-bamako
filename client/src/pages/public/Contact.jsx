export default function Contact() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold text-fseg-green mb-6">Contact</h2>

      <div className="space-y-3 text-gray-700 mb-8">
        <p><strong>Adresse :</strong> Colline de Badalabougou, Bamako</p>
        <p><strong>Téléphone :</strong> +223 20 22 35 04</p>
        <p><strong>Email :</strong>{' '}
          <a href="mailto:fseg@fseg-ussgb.net" className="text-fseg-green hover:underline">
            fseg@fseg-ussgb.net
          </a>
        </p>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">Localisation</h3>
      <iframe
        title="FSEG Bamako"
        width="100%"
        height="400"
        style={{ border: 0, borderRadius: '12px' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15574.347042420293!2d-7.998325457656861!3d12.609463949947378!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xe51cdc5b93a5141%3A0x41e76ffe9b7778d3!2sCompagnie%20et%20centre%20de%20secours%20de%20Sogoniko!5e0!3m2!1sfr!2sml!4v1766489359877!5m2!1sfr!2sml"
      />
    </section>
  );
}
