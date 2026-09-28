async function fetchAsFile(src: string, name: string): Promise<File> {
  const res = await fetch(src);
  const blob = await res.blob();
  const ext = blob.type.split('/')[1] ?? 'png';
  return new File([blob], `${name}.${ext}`, { type: blob.type || 'image/png' });
}

export async function downloadSelo(src: string, name: string) {
  try {
    const file = await fetchAsFile(src, name);
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, '_blank');
  }
}

// Tenta abrir o menu nativo de compartilhamento (que inclui o WhatsApp como
// destino quando o app está instalado) já com a imagem anexada; se o
// navegador não suportar, cai no link direto do WhatsApp com a URL do selo.
export async function shareSeloToWhatsApp(src: string, name: string) {
  try {
    const file = await fetchAsFile(src, name);
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch {
    // usuário cancelou o compartilhamento nativo ou o navegador falhou — cai no link abaixo
  }
  window.open(
    `https://wa.me/?text=${encodeURIComponent(`${name} — Selos do Dia: ${src}`)}`,
    '_blank',
  );
}
