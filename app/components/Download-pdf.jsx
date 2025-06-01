'use client';

const DownloadAllButton = () => {
  const handleDownload = async () => {
    const res = await fetch('/api/generate-pdf');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all-reports.pdf';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      style={{ position: 'fixed', top: 20, right: 20 }}
    >
      Download All Reports
    </button>
  );
};

export default DownloadAllButton;
