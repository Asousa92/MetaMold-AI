# MetaMold AI - Especialista em Moldes 3D

Sistema completo de orçamentação inteligente para moldes de injeção, com processamento de ficheiros CAD e análise de geometrias 3D.

## 🏗️ Arquitetura do Projeto

```
metamold-ai/
├── backend/                 # API Python (FastAPI)
│   ├── main.py             # Servidor principal
│   ├── services/
│   │   ├── step_processor.py    # Processamento de ficheiros STEP
│   │   ├── geometry_analyzer.py # Análise de geometrias
│   │   └── budget_calculator.py # Cálculo de orçamentos
│   └── pyproject.toml      # Configuração Poetry
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── App.tsx         # Componente principal
│   │   ├── components/     # Componentes UI
│   │   ├── services/       # Serviços de API
│   │   ├── types.ts        # Tipos TypeScript
│   │   └── constants.ts    # Constantes da aplicação
│   └── package.json        # Dependências npm
└── streamlit_app.py        # App Streamlit (demo)
```

## 🚀 Funcionalidades

- **Orçamentação Multi-CAD**: Suporte para ficheiros STL, STEP e SLDPRT
- **Visualização 3D**: Renderização interativa com Three.js
- **Análise de Geometria**: Cálculo de volume, área e complexidade
- **Copiloto AI**: Assistente inteligente para sugestões técnicas
- **Gestão de Bases**: Integração com sistemas HASCO, DME e FUTABA
- **Dashboard Operacional**: Métricas e relatórios de gestão

## 🛠️ Instalação

### Backend (Python/FastAPI)

```bash
cd backend

# Usando Poetry (recomendado)
poetry install

# Ou usando pip
pip install -r requirements.txt

# Iniciar servidor
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend (React/Vite)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Streamlit (Demo)

```bash
# Instalar Streamlit
pip install streamlit

# Executar aplicação
streamlit run streamlit_app.py
```

## 📦 Dependências Principais

### Backend
- **FastAPI**: Framework web assíncrono
- **pythonocc-core**: OpenCASCADE para STEP
- **trimesh**: Processamento de malhas 3D
- **numpy/scipy**: Cálculos numéricos
- **uvicorn**: Servidor ASGI

### Frontend
- **React 18**: Framework UI
- **Three.js**: Renderização 3D
- **@react-three/fiber**: React bindings para Three.js
- **TailwindCSS**: Estilização
- **Lucide React**: Ícones

## 🔧 Configuração

### Variáveis de Ambiente

Crie um ficheiro `.env` na pasta backend:

```env
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true
LOG_LEVEL=info
```

### Parâmetros de Orçamentação

Os parâmetros de cálculo podem ser ajustados em `frontend/src/constants.ts`:
- Preços de materiais por cm³
- Multiplicadores de acabamento
- Taxas horárias de processamento
- Custos de bases normalizadas

## 📡 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Verificação de saúde |
| POST | `/api/upload/step` | Processar ficheiro STEP |
| POST | `/api/geometry/analyze` | Analisar geometria |
| POST | `/api/budget/calculate` | Calcular orçamento |
| GET | `/api/materials` | Listar materiais |
| GET | `/api/finishes` | Listar acabamentos |
| GET | `/api/mold-bases` | Listar bases de molde |

## 🎨 Interface

A aplicação segue um design moderno "dark mode" com:
- Esquema de cores slate/blue
- Componentes com bordas arredondadas
- Animações suaves
- Ícones Lucide
- Tipografia Inter

## 📱 Deployment

### Streamlit Cloud

Para deployment no Streamlit Cloud:
1. Envie o código para GitHub
2. Ligue o repositório ao Streamlit Cloud
3. Configure os requisitos em `requirements.txt`

### Docker (Futuro)

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY . .
RUN pip install -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🔒 Notas

- Esta versão utiliza processamento simulado para demonstrações
- Para produção, é necessário configurar OpenCASCADE real
- Os orçamentos são estimativas e devem ser validados

## 📄 Licença

MIT License

---

Desenvolvido por MiniMax Agent
