# AI Question Bank Engine - Setup & Installation Guide

**Complete guide to setting up the AI-powered Question Bank Engine**

---

## 📋 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Full Setup (15 minutes)](#full-setup)
3. [LLM Provider Configuration](#llm-configuration)
4. [Vector Store Setup](#vector-store)
5. [Usage Examples](#usage-examples)
6. [Troubleshooting](#troubleshooting)
7. [Docker Deployment](#docker-deployment)

---

## ⚡ Quick Start

### For Impatient Users (5 minutes)

```bash
# 1. Navigate to engine
cd ai-engine/question_bank_engine

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and configure
cp .env.example .env
# Edit .env: Add GROQ_API_KEY from https://console.groq.com

# 4. Start server
python -m api

# 5. Visit: http://localhost:8001/docs
```

Done! API is live with interactive Swagger documentation.

---

## 🔧 Full Setup

### Step 1: Prerequisites

```bash
# Python 3.10 or newer
python --version

# Virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows
```

### Step 2: Install Dependencies

```bash
cd ai-engine/question_bank_engine

# Install all packages
pip install -r requirements.txt

# Verify installations
python -c "import langchain, chromadb, sentence_transformers; print('✅ All installed')"
```

### Step 3: Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # Linux/Mac
# OR
code .env  # VS Code
# OR open in your favorite editor on Windows
```

Edit these essential variables:

```env
# Choose ONE LLM provider

# Option 1: Groq (Recommended - Fast & Free tier available)
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_your_api_key_here

# Option 2: OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk_your_api_key_here

# Option 3: Local Ollama (No API key needed)
# LLM_PROVIDER=ollama
# First install: https://ollama.ai
# Then: ollama pull llama2
```

### Step 4: Start the Server

```bash
# Activate virtual environment (if using one)
source venv/bin/activate

# Start the engine
python -m question_bank_engine.api

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Step 5: Verify Installation

```bash
# In a new terminal:
curl http://localhost:8001/health

# Expected response:
# {"status":"healthy","components":{"vector_store":"no_data",...},...}
```

---

## 🤖 LLM Configuration

### Option 1: Groq (RECOMMENDED)

**Best for**: Speed & Cost (free tier available)

```bash
# 1. Get API key
# Visit: https://console.groq.com/keys
# Create new API key

# 2. Add to .env
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GROQ_MODEL=mixtral-8x7b-32768
# Alternatives: llama2-70b-4096, llama-2-13b-chat

# 3. Test
curl -X POST "http://localhost:8001/questions/generate" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Algebra","difficulty":"easy","count":1}'
```

### Option 2: OpenAI

**Best for**: Quality & Reliability

```bash
# 1. Get API key
# Visit: https://platform.openai.com/api-keys
# Create new secret key

# 2. Add to .env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk_xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4-turbo-preview
# Alternatives: gpt-4, gpt-3.5-turbo

# 3. Fund your account (pay-as-you-go)
# https://platform.openai.com/account/billing/overview
```

### Option 3: Ollama (LOCAL - NO API KEY)

**Best for**: Privacy & No Costs

```bash
# 1. Install Ollama
# macOS/Linux: https://ollama.ai/download
# Windows: https://ollama.ai/download/windows

# 2. Download a model (in new terminal)
ollama pull llama2
# Or: ollama pull mixtral  # Faster & better quality

# 3. Start Ollama server
ollama serve
# Keep this running!

# 4. Configure .env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# 5. Test
curl -X POST "http://localhost:8001/questions/generate" \
  -H "Content-Type: application/json" \
  -d '{"topic":"Math","difficulty":"easy","count":1}'
# Note: First request takes time (model loading)
```

---

## 🗄️ Vector Store Setup

### Understanding ChromaDB

ChromaDB stores document embeddings locally (no cloud dependency).

```bash
# Auto-created on first run:
# - data/chroma_db/           ← Vector database
# - data/documents/           ← Upload PDFs/DOCs here
# - data/embeddings/          ← Cached embeddings
# - logs/                     ← Server logs
```

### Load Sample Documents

```bash
# 1. Create documents directory (auto-created)
mkdir -p data/documents

# 2. Add PDF/DOCX files
# Example:
# - Quantitative Aptitude PDF
# - Logical Reasoning Book Chapter
# - Any educational material

# 3. Ingest documents
curl -X POST "http://localhost:8001/documents/ingest-batch" \
  -H "x-api-key: dev-key-question-engine"

# Response:
# {
#   "success": true,
#   "documents_ingested": 3,
#   "total_chunks": 156,
#   "added_to_vector_store": 156
# }
```

### Verify Knowledge Base

```bash
# Check status
curl "http://localhost:8001/status/knowledge-base"

# Response:
# {
#   "status": "healthy",
#   "knowledge_base": {
#     "total_chunks": 156,
#     "unique_documents": 3,
#     "embedding_model": "sentence-transformers/all-MiniLM-L6-v2"
#   }
# }
```

---

## 📚 Usage Examples

### Generate Questions (Interactive Swagger)

Visit: **http://localhost:8001/docs**

Click "Try it out" on any endpoint to test.

### Generate Questions (via curl)

```bash
# Single topic
curl -X POST "http://localhost:8001/questions/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Profit and Loss",
    "difficulty": "medium",
    "question_type": "multiple_choice",
    "count": 3,
    "use_rag": true
  }'
```

### Generate Full Exam

```bash
curl -X POST "http://localhost:8001/questions/generate-exam" \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["Percentages", "Profit Loss", "Ratios", "Time and Work"],
    "difficulty": "hard",
    "questions_per_topic": 2,
    "mix_types": true
  }'
```

### Search Knowledge Base

```bash
curl -X POST "http://localhost:8001/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is compound interest formula?",
    "top_k": 5
  }'
```

### Analyze Knowledge Gaps

```bash
curl -X POST "http://localhost:8001/analytics/knowledge-gaps" \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["Algebra", "Geometry", "Trigonometry"]
  }'

# Response shows coverage for each topic:
# {
#   "Algebra": {"coverage_score": 0.85, "coverage_status": "well_covered"},
#   "Geometry": {"coverage_score": 0.42, "coverage_status": "partially_covered"},
#   "Trigonometry": {"coverage_score": 0.15, "coverage_status": "needs_content"}
# }
```

---

## 🐛 Troubleshooting

### Issue: "LLM API key not found"

```bash
# Check .env file
cat .env | grep API_KEY

# Make sure:
# 1. GROQ_API_KEY / OPENAI_API_KEY is set (not empty)
# 2. Key format is correct (starts with gsk_ or sk_)
# 3. No extra spaces or quotes
```

### Issue: "No module named 'langchain'"

```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt

# Verify
python -c "import langchain; print(langchain.__version__)"
```

### Issue: "Connection refused: 8001"

```bash
# Port might be in use, change it:
# Edit .env: API_PORT=8002
# Or kill process using port 8001

# Linux/Mac:
lsof -i :8001
kill -9 <PID>

# Windows:
netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

### Issue: "ChromaDB permission denied"

```bash
# Fix directory permissions
chmod -R 755 data/chroma_db
chmod -R 755 data/documents

# Or reset data
rm -rf data/chroma_db
# It will recreate on next run
```

### Issue: "Ollama connection error"

```bash
# Make sure Ollama is running
# In separate terminal:
ollama serve

# Verify connection
curl http://localhost:11434/api/tags

# If not installed:
# Visit https://ollama.ai/download
```

### Issue: Slow embedding generation

```bash
# Speed up with GPU (if available)
# Edit .env:
EMBEDDING_DEVICE=cuda  # NVIDIA GPU
# or
EMBEDDING_DEVICE=mps   # Apple Metal

# Or use faster model:
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

## 🐳 Docker Deployment

### Build Docker Image

```bash
# From project root
docker build -f ai-engine/question_bank_engine/Dockerfile.question-engine -t talentsecure-question-engine .
```

### Run Container

```bash
docker run -d \
  -p 8001:8001 \
  -e LLM_PROVIDER=groq \
  -e GROQ_API_KEY=$GROQ_API_KEY \
  -v $(pwd)/ai-engine/question_bank_engine/data:/app/data \
  --name question-engine \
  talentsecure-question-engine

# View logs
docker logs question-engine -f

# Stop
docker stop question-engine
```

### Docker Compose (with main stack)

```yaml
# Add to docker-compose.yml
  question-engine:
    build:
      context: .
      dockerfile: ai-engine/question_bank_engine/Dockerfile.question-engine
    ports:
      - "8001:8001"
    environment:
      LLM_PROVIDER: groq
      GROQ_API_KEY: ${GROQ_API_KEY}
      EMBEDDING_MODEL: sentence-transformers/all-MiniLM-L6-v2
      EMBEDDING_DEVICE: cpu
    volumes:
      - ./ai-engine/question_bank_engine/data:/app/data
    depends_on:
      - postgres
    networks:
      - talentsecure-network
```

Start entire stack:
```bash
docker-compose up -d
```

---

## 📊 Performance Tuning

### For Speed

```env
# Use Groq
LLM_PROVIDER=groq
GROQ_MODEL=mixtral-8x7b-32768

# Faster embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DEVICE=cuda

# Smaller chunks for faster retrieval
VECTOR_STORE_CHUNK_SIZE=512
VECTOR_STORE_TOP_K=3
```

### For Quality

```env
# Use OpenAI
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4

# Better embeddings
EMBEDDING_MODEL=sentence-transformers/all-mpnet-base-v2

# Larger context
VECTOR_STORE_CHUNK_SIZE=1024
VECTOR_STORE_CHUNK_OVERLAP=256
VECTOR_STORE_TOP_K=5
```

### For Cost

```env
# Use Ollama (free, local)
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama2

# Free embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
```

---

## ✅ Verification Checklist

- [ ] Python 3.10+ installed
- [ ] Virtual environment created & activated
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] .env configured with LLM API key
- [ ] Server starts without errors (`python -m api`)
- [ ] Health check passes (`curl http://localhost:8001/health`)
- [ ] Swagger docs load (`http://localhost:8001/docs`)
- [ ] Sample documents in `data/documents/`
- [ ] Documents ingested successfully
- [ ] Questions generating correctly
- [ ] Search working as expected

---

## 📞 Quick Support

| Issue | Solution |
|-------|----------|
| No API key | Get from Groq/OpenAI console |
| Slow start | First embedding generation is slow (model load) |
| No documents | Ingest batch via `/documents/ingest-batch` |
| Memory error | Reduce `EMBEDDING_MODEL` size or use GPU |
| Port in use | Change `API_PORT` in .env |

---

## 🎓 Learning Resources

- **LangChain**: https://python.langchain.com/
- **ChromaDB**: https://www.trychroma.com/
- **HuggingFace**: https://huggingface.co/
- **Groq API**: https://console.groq.com
- **Ollama**: https://ollama.ai

---

## 🚀 Next Steps

1. ✅ Install & start engine (this guide)
2. 📚 Add knowledge base documents
3. 🤖 Generate first questions
4. 🔌 Integrate with main TalentSecure-AI API
5. 📊 Monitor & optimize performance

---

**AI Question Bank Engine is now ready! 🎉**

For detailed API documentation, visit: http://localhost:8001/docs
