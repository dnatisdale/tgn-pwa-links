import React from 'react';

let deferred: any = null;

export default function InstallPWA({
  className = 'btn btn-red install-pwa',
  label = 'Install',
  disabledLabel = 'Install',
}) {
  const [canInstall, setCanInstall] = React.useState(false);

  React.useEffect(() => {
    const onBIP = (e: any) => {
      e.preventDefault();
      deferred = e;
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  const onClick = async () => {
    if (!deferred) return;
    deferred.prompt();
    const choice = await deferred.userChoice;
    deferred = null;
    setCanInstall(false);
    // optional: console.log('A2HS choice', choice.outcome)
  };

  return (
    <button className={className} onClick={onClick} disabled={!canInstall}>
      {canInstall ? label : disabledLabel}
    </button>
  );
}
