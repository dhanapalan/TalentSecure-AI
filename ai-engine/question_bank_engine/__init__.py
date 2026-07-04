"""
AI Question Bank Engine
=======================
RAG-powered question generation from document knowledge base.

Version: 1.0.0
License: Proprietary
"""

__version__ = "1.0.0"
__author__ = "TalentSecure AI"

from .engine import QuestionBankEngine
from .rag_engine import QuestionGenerator, RAGEngine
from .vector_store import VectorStore
from .document_loader import DocumentLoader, Document, DocumentChunk
from .config import config

__all__ = [
    "QuestionBankEngine",
    "QuestionGenerator",
    "RAGEngine",
    "VectorStore",
    "DocumentLoader",
    "Document",
    "DocumentChunk",
    "config",
]

print("✅ AI Question Bank Engine loaded")
