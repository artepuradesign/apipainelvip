import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import { Loader2 } from 'lucide-react';
import QRCode from 'react-qr-code';

interface FormData {
  nome: string;
  dataNascimento: string;
  numeroDocumento: string;
  pai: string;
  mae: string;
  token: string;
  foto: File | null;
}

const QRCodeRg6m = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    dataNascimento: '',
    numeroDocumento: '',
    pai: '',
    mae: '',
    token: '',
    foto: null
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, foto: file }));
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.nome.trim()) {
      toast.error('Nome Completo é obrigatório');
      return;
    }
    
    if (!formData.dataNascimento) {
      toast.error('Data de Nascimento é obrigatória');
      return;
    }
    
    if (!formData.numeroDocumento.trim()) {
      toast.error('Número de Documento é obrigatório');
      return;
    }
    
    if (!formData.mae.trim()) {
      toast.error('Nome da Mãe é obrigatório');
      return;
    }

    setIsLoading(true);

    try {
      // Gerar dados do QR Code baseado no formulário
      const qrData = {
        nome: formData.nome,
        nascimento: formData.dataNascimento,
        documento: formData.numeroDocumento,
        pai: formData.pai,
        mae: formData.mae,
        token: formData.token || 'N/A',
        geradoEm: new Date().toISOString(),
        userId: user?.id
      };

      // Converter para string para o QR Code
      const qrString = JSON.stringify(qrData);
      setQrCodeData(qrString);

      toast.success('QR Code gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast.error('Erro ao gerar QR Code. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nome: '',
      dataNascimento: '',
      numeroDocumento: '',
      pai: '',
      mae: '',
      token: '',
      foto: null
    });
    setQrCodeData(null);
    setPreviewUrl(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 space-y-6">
        <SimpleTitleBar
          title="QR Code RG 6M"
          subtitle="Gere o QR Code do documento de identidade"
          onBack={() => navigate('/dashboard')}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Formulário de Cadastro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados do Documento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Digite o nome completo"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroDocumento">Número de Documento *</Label>
                  <Input
                    id="numeroDocumento"
                    type="text"
                    placeholder="Digite o número do documento"
                    value={formData.numeroDocumento}
                    onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pai">Pai</Label>
                  <Input
                    id="pai"
                    type="text"
                    placeholder="Nome do pai (opcional)"
                    value={formData.pai}
                    onChange={(e) => handleInputChange('pai', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mae">Mãe *</Label>
                  <Input
                    id="mae"
                    type="text"
                    placeholder="Nome da mãe"
                    value={formData.mae}
                    onChange={(e) => handleInputChange('mae', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="token">Token (opcional)</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Token de identificação"
                    value={formData.token}
                    onChange={(e) => handleInputChange('token', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto">Foto</Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      'Gerar QR Code'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={isLoading}
                  >
                    Limpar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview do QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code Gerado</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
              {qrCodeData ? (
                <div className="space-y-4 text-center">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <QRCode
                      value={qrCodeData}
                      size={200}
                      level="H"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      QR Code gerado para: <strong>{formData.nome}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Documento: {formData.numeroDocumento}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Função para download do QR Code
                      const svg = document.querySelector('#qr-code-container svg');
                      if (svg) {
                        const svgData = new XMLSerializer().serializeToString(svg);
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        const img = new Image();
                        img.onload = () => {
                          canvas.width = img.width;
                          canvas.height = img.height;
                          ctx?.drawImage(img, 0, 0);
                          const pngFile = canvas.toDataURL('image/png');
                          const downloadLink = document.createElement('a');
                          downloadLink.download = `qrcode-${formData.numeroDocumento}.png`;
                          downloadLink.href = pngFile;
                          downloadLink.click();
                        };
                        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                      }
                    }}
                  >
                    Baixar QR Code
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>Preencha o formulário ao lado e clique em "Gerar QR Code"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QRCodeRg6m;
