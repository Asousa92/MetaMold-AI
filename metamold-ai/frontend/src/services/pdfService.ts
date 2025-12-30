/**
 * Serviço de geração de PDFs de orçamento.
 * Usa funcionalidades nativas do browser para criar PDFs.
 */

import { FileMetadata, GeometryStats, BudgetBreakdown } from '../types';

interface BudgetData {
  metadata: FileMetadata;
  stats: GeometryStats;
  material: string;
  finish: string;
  quantity: number;
  moldBase?: any;
  cadBase?: any;
  totalPrice: number;
}

export const generateTechnicalBudgetPDF = (data: BudgetData) => {
  // Criar conteúdo HTML para impressão
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Orçamento Técnico - MetaMold AI</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          padding: 40px;
          color: #1e293b;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1e293b;
        }
        .section {
          margin-bottom: 25px;
        }
        .section-title {
          font-size: 14px;
          font-weight: bold;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 5px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .item {
          padding: 10px;
          background: #f8fafc;
          border-radius: 6px;
        }
        .item-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }
        .item-value {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-top: 4px;
        }
        .price-section {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          margin-top: 30px;
        }
        .price-label {
          font-size: 14px;
          opacity: 0.9;
        }
        .price-value {
          font-size: 36px;
          font-weight: bold;
          margin-top: 5px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #94a3b8;
          text-align: center;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">MetaMold AI</div>
          <div style="font-size: 12px; color: #64748b;">Especialista em Moldes 3D</div>
        </div>
        <div style="text-align: right;">
          <div class="title">Orçamento Técnico</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 5px;">
            ${new Date().toLocaleDateString('pt-PT')}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Informações do Ficheiro</div>
        <div class="grid">
          <div class="item">
            <div class="item-label">Nome do Ficheiro</div>
            <div class="item-value">${data.metadata.name}</div>
          </div>
          <div class="item">
            <div class="item-label">Formato</div>
            <div class="item-value">${data.metadata.type}</div>
          </div>
          <div class="item">
            <div class="item-label">Volume</div>
            <div class="item-value">${data.stats.volume.toFixed(2)} cm³</div>
          </div>
          <div class="item">
            <div class="item-label">Dimensões</div>
            <div class="item-value">
              ${data.stats.dimensions.x.toFixed(1)} × ${data.stats.dimensions.y.toFixed(1)} × ${data.stats.dimensions.z.toFixed(1)} mm
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Configurações de Fabrico</div>
        <div class="grid">
          <div class="item">
            <div class="item-label">Material</div>
            <div class="item-value">${data.material}</div>
          </div>
          <div class="item">
            <div class="item-label">Acabamento</div>
            <div class="item-value">${data.finish}</div>
          </div>
          <div class="item">
            <div class="item-label">Quantidade</div>
            <div class="item-value">${data.quantity} peças</div>
          </div>
          ${data.moldBase ? `
          <div class="item">
            <div class="item-label">Base de Molde</div>
            <div class="item-value">${data.moldBase.standard}</div>
          </div>
          ` : ''}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Análise de Complexidade</div>
        <div class="grid">
          <div class="item">
            <div class="item-label">Índice de Complexidade</div>
            <div class="item-value">${data.stats.mesh_info?.complexity_score || 'N/A'}</div>
          </div>
          <div class="item">
            <div class="item-label">Dificuldade</div>
            <div class="item-value">${data.stats.mesh_info?.difficulty_rating || 'Média'}</div>
          </div>
        </div>
      </div>

      <div class="price-section">
        <div class="price-label">Orçamento Total Estimado</div>
        <div class="price-value">€${data.totalPrice.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</div>
        <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
          Preço por peça: €${(data.totalPrice / data.quantity).toFixed(2)}
        </div>
      </div>

      <div class="footer">
        <p>Orçamento gerado por MetaMold AI - Sistema de Orçamentação Inteligente</p>
        <p>Este orçamento é uma estimativa e pode variar conforme análise detalhada.</p>
      </div>
    </body>
    </html>
  `;

  // Criar janela de impressão
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar carregamento e imprimir
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};
