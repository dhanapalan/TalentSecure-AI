# AI-Powered Question Bank Engine

**Intelligent question generation using LangChain, ChromaDB, and RAG (Retrieval-Augmented Generation)**

Generate high-quality questions automatically from your knowledge base using LLMs and semantic search.

---

## 🎯 Features

### 🔍 Knowledge Base Management
- **Multi-format document support**: PDF, DOCX, TXT, Markdown
- **Intelligent chunking**: Overlap-aware document splitting
- **ChromaDB vector storage**: Local, open-source vector database
- **HuggingFace embeddings**: Free, local embeddings (no API costs)

### 🤖 Question Generation
- **Multiple question types**: MCQ, Short Answer, True/False, Essay, Coding
- **Difficulty levels**: Easy, Medium, Hard, Expert
- **RAG-powered**: Context-aware generation from knowledge base
- **Batch generation**: Create exams with multiple topics at once

### 🔎 Semantic Search & Retrieval
- **Knowledge base search**: Find relevant content instantly
- **RAG context**: Automatic context retrieval for generation
- **Similarity scoring**: Ranked results with confidence scores
- **Topic coverage analysis**: Identify knowledge gaps

### ⚡ LLM Flexibility
- **Groq** (Recommended): Fast & cheap API
- **OpenAI**: High-quality GPT models
- **Ollama**: 100% local LLMs (Llama2, Mistral, etc.)
- **Anthropic Claude**: Fallback option

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- 4GB RAM (8GB recommended)
- GPU optional (for faster embeddings)

### Installation

```bash
# 1. Install dependencies
cd ai-engine/question_bank_engine
pip install -r requirements.txt

# 2. Copy environment file
cp .env.example .env

# 3. Fill in API keys (choose at least one LLM provider)
# Option A: Groq (Recommended)
#   - Get key: https://console.groq.com
#   - Set LLM_PROVIDER=groq, GROQ_API_KEY=...

# Option B: OpenAI
#   - Get key: https://platform.openai.com/api-keys
#   - Set LLM_PROVIDER=openai, OPENAI_API_KEY=...

# Option C: Ollama (100% Local, No API Key)
#   - Install: https://ollama.ai
#   - Run: ollama serve (in another terminal)
#   - Set LLM_PROVIDER=ollama
```

### Start the Engine

```bash
# Start API server
python -m question_bank_engine.api

# Server will start at http://localhost:8001
# API docs at http://localhost:8001/docs (interactive Swagger UI)
```

---

## 📚 Usage

### 1. Ingest Documents

```bash
# Place PDF/DOCX files in ./data/documents/

curl -X POST "http://localhost:8001/documents/ingest-batch" \
  -H "x-api-key: dev-key-question-engine"
```

### 2. Generate Questions

#### Option A: Topic-Based
```bash
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

#### Option B: Full Exam
```bash
curl -X POST "http://localhost:8001/questions/generate-exam" \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["Percentages", "Profit Loss", "Ratios"],
    "difficulty": "hard",
    "questions_per_topic": 2,
    "mix_types": true
  }'
```

### 3. Search Knowledge Base

```bash
curl -X POST "http://localhost:8001/search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is compound interest?",
    "top_k": 5
  }'
```

### 4. Analyze Knowledge Gaps

```bash
curl -X POST "http://localhost:8001/analytics/knowledge-gaps" \
  -H "Content-Type: application/json" \
  -d '{
    "topics": ["Algebra", "Geometry", "Trigonometry"]
  }'
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Server                          │
│  (API Endpoints for generation, search, analytics)          │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐  ┌──────────┐  ┌────────────┐
   │ Engine │  │RAG Engine│  │ Vector DB  │
   │Orchestr│  │(LangChain)   │(ChromaDB)  │
   └────┬───┘  └──────┬───┘  └──────┬─────┘
        │             │              │
    ┌───┴─────┐  ┌────┴────┐   ┌────┴──────┐
    │ Docs    │  │   LLM   │   │Embeddings │
    │Loader   │  │ (Groq/  │   │(HuggingFace)
    │(PDF)    │  │  OpenAI)│   │           │
    └─────────┘  └─────────┘   └───────────┘
```

### Key Components

1. **document_loader.py**
   - PDF, DOCX, TXT, Markdown parsing
   - Intelligent chunking with overlap
   - Batch document ingestion

2. **vector_store.py**
   - ChromaDB management
   - Semantic similarity search
   - Collection operations

3. **rag_engine.py**
   - RAG orchestration
   - LLM interaction
   - Question parsing

4. **engine.py**
   - Unified API
   - Document-to-questions pipeline
   - Analytics & insights

5. **api.py**
   - FastAPI server
   - REST endpoints
   - API documentation

---

## 📖 Configuration

All settings in `config.py`:

```python
# LLM Provider
LLM_PROVIDER = "groq"  # groq|openai|ollama|anthropic

# Embeddings
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DEVICE = "cpu"  # cpu|cuda|mps

# Vector Store
VECTOR_STORE_CHUNK_SIZE = 1024
VECTOR_STORE_TOP_K = 5

# Question Generation
QUESTION_TYPES = ["multiple_choice", "short_answer", "true_false"]
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]
```

---

## 🧪 Testing

```bash
# Test document loading
python -m question_bank_engine.document_loader

# Test vector store
python -m question_bank_engine.vector_store

# Test RAG engine
python -m question_bank_engine.rag_engine

# Test main engine
python -m question_bank_engine.engine

# Run full test suite
pytest question_bank_engine/
```

---

## 📊 Example: Knowledge Base Setup

### Step 1: Add Sample Documents

```bash
# Create data directory
mkdir -p data/documents

# Add your PDF/DOCX files:
# - data/documents/quantitative_aptitude.pdf
# - data/documents/logical_reasoning.docx
# - data/documents/verbal_ability.md
```

### Step 2: Ingest Documents

```bash
curl -X POST "http://localhost:8001/documents/ingest-batch" \
  -H "x-api-key: dev-key-question-engine"
```

### Step 3: Generate Questions

```bash
curl -X POST "http://localhost:8001/questions/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Percentages",
    "difficulty": "medium",
    "question_type": "multiple_choice",
    "count": 5
  }'
```

### Output:
```json
{
  "success": true,
  "topic": "Percentages",
  "difficulty": "medium",
  "generated_count": 5,
  "questions": [
    {
      "question": "If the price of an item is increased by 20%, what is the new price?",
      "options": ["20% more", "120% of original", "$120", "...]},
      "correct_answer": "120% of original",
      "explanation": "...",
      "topic": "Percentages"
    },
    ...
  ]
}
```

---

## 🔌 Integration with TalentSecure-AI

### Connect to Main API

```python
# In server/src/routes/question_bank_ai.routes.ts
import axios from 'axios';

const AI_ENGINE_URL = 'http://localhost:8001';

export async function generateQuestionsAI(topic, difficulty, count) {
  const response = await axios.post(
    `${AI_ENGINE_URL}/questions/generate`,
    { topic, difficulty, question_type: 'multiple_choice', count }
  );
  return response.data.questions;
}
```

### Create Questions in Database

```python
# Generated questions → Insert into PostgreSQL question_bank table
for question in generated_questions:
    await queryOne(`
        INSERT INTO question_bank 
        (category, type, difficulty_level, question_text, options, correct_answer, explanation)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
        question.topic,
        question.question_type,
        question.difficulty,
        question.question,
        JSON.stringify(question.options),
        question.correct_answer,
        question.explanation
    ])
```

---

## 🚀 Performance

### Embedding Generation
- **Model**: all-MiniLM-L6-v2 (384-dim)
- **Speed**: ~500 chunks/min (CPU)
- **Memory**: ~1GB (CPU), ~400MB (GPU)

### Question Generation
- **Single Question**: 2-5 seconds (Groq/OpenAI), 10-30s (Ollama)
- **Batch (5 questions)**: 10-30 seconds
- **Exam (3 topics × 3 questions)**: ~2-3 minutes

### Optimization Tips
- Use Groq or OpenAI for fastest generation
- Run embeddings on GPU if available (`EMBEDDING_DEVICE=cuda`)
- Use smaller embedding model for speed (all-MiniLM vs all-mpnet)
- Cache embeddings locally

---

## 🐳 Docker Deployment

```dockerfile
# Dockerfile.question-engine
FROM python:3.11-slim

WORKDIR /app

COPY ai-engine/question_bank_engine/requirements.txt .
RUN pip install -r requirements.txt

COPY ai-engine/question_bank_engine .

ENV LLM_PROVIDER=groq
ENV API_HOST=0.0.0.0
ENV API_PORT=8001

EXPOSE 8001

CMD ["python", "-m", "api"]
```

```bash
# Build & run
docker build -f Dockerfile.question-engine -t question-engine .
docker run -p 8001:8001 \
  -e GROQ_API_KEY=$GROQ_API_KEY \
  question-engine
```

---

## 📝 Supported Document Types

| Format | Extension | Parser | Support |
|--------|-----------|--------|---------|
| PDF | .pdf | PyPDF2 / pdfplumber | ✅ Full |
| Word | .docx | python-docx | ✅ Full |
| Text | .txt | Built-in | ✅ Full |
| Markdown | .md | Built-in | ✅ Full |
| HTML | .html | Unstructured* | ⚠️ Partial |
| Images | .png/.jpg | Unstructured* | ⚠️ Partial (needs OCR) |

*Requires additional setup

---

## 🤝 Contributing

1. Create sample documents in `data/documents/`
2. Test embedding & search quality
3. Improve question parsing
4. Add new question types

---

## 📄 License

Proprietary — TalentSecure AI

---

## 📞 Support

Issues or questions? Check:
1. `.env` configuration (API keys set)
2. Server logs: `tail -f logs/question_engine.log`
3. Health check: `curl http://localhost:8001/health`
4. API docs: `http://localhost:8001/docs`

---

**Built with ❤️ using LangChain, ChromaDB, and HuggingFace**
