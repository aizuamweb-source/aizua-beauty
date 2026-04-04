import MainNav from '@/components/nav/MainNav';
import Footer from '@/components/nav/Footer';

export default async function LegalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MainNav locale={locale} />
      <main style={{ flex: 1, paddingTop: '84px' }}>
        {children}
      </main>
      <Footer locale={locale} />
    </div>
  );
}
