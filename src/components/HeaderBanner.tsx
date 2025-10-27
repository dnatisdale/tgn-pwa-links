import banner from '@/assets/banner-1200x300.png';

export default function HeaderBanner() {
  return (
    <div
      style={{
        width: '100%',
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F5F8',
        borderBottom: '1px solid #000',
      }}
    >
      <img
        src={banner}
        alt="Thai Good News banner"
        style={{ display: 'block', width: '100%', maxWidth: 1200, height: 'auto' }}
      />
    </div>
  );
}
