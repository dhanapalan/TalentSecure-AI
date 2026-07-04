"""
Vector Store Manager
====================
ChromaDB-based vector database for RAG knowledge retrieval.
"""

import logging
from typing import List, Dict, Tuple, Optional
from datetime import datetime

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer

from config import config
from document_loader import DocumentChunk

logger = logging.getLogger(__name__)


class VectorStore:
    """ChromaDB-based vector store for document embeddings"""

    def __init__(self, collection_name: str = None):
        self.collection_name = collection_name or config.vector_store.collection_name
        self.top_k = config.vector_store.top_k
        self.similarity_threshold = config.vector_store.similarity_threshold

        # Initialize ChromaDB (PersistentClient auto-persists to disk)
        self.client = chromadb.PersistentClient(
            path=str(config.vector_store.persist_directory),
            settings=Settings(anonymized_telemetry=False),
        )

        # Initialize embeddings
        logger.info(f"Loading embedding model: {config.embedding.model_name}")
        self.embeddings = SentenceTransformer(
            config.embedding.model_name,
            device=config.embedding.device,
            cache_folder=config.embedding.cache_folder,
        )

        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": config.vector_store.distance_metric},
        )
        logger.info(
            f"✅ Collection ready: {self.collection_name} "
            f"({self.collection.count()} chunks)"
        )

    def add_chunks(self, chunks: List[DocumentChunk]) -> Dict:
        """Add document chunks to vector store"""
        if not chunks:
            logger.warning("No chunks to add")
            return {"added": 0, "errors": 0}

        ids = []
        embeddings = []
        documents = []
        metadatas = []

        logger.info(f"Generating embeddings for {len(chunks)} chunks...")

        for chunk in chunks:
            try:
                # Generate embedding
                embedding = self.embeddings.encode(chunk.content, convert_to_numpy=True)

                ids.append(chunk.id)
                embeddings.append(embedding.tolist())
                documents.append(chunk.content)
                metadatas.append(
                    {
                        **chunk.metadata,
                        "document_id": chunk.document_id,
                        "chunk_index": str(chunk.chunk_index),
                        "added_at": datetime.now().isoformat(),
                    }
                )
            except Exception as e:
                logger.error(f"Error embedding chunk {chunk.id}: {e}")
                continue

        # Add to ChromaDB
        if ids:
            try:
                self.collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    documents=documents,
                    metadatas=metadatas,
                )
                logger.info(f"✅ Added {len(ids)} chunks to vector store")
                return {"added": len(ids), "errors": len(chunks) - len(ids)}
            except Exception as e:
                logger.error(f"Error adding chunks to ChromaDB: {e}")
                return {"added": 0, "errors": len(chunks)}

        return {"added": 0, "errors": len(chunks)}

    def search(
        self, query: str, top_k: int = None, similarity_threshold: float = None
    ) -> List[Tuple[str, float]]:
        """Search for relevant chunks using semantic similarity"""
        top_k = top_k or self.top_k
        similarity_threshold = similarity_threshold or self.similarity_threshold

        try:
            # Generate query embedding
            query_embedding = self.embeddings.encode(query, convert_to_numpy=True).tolist()

            # Search in ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                include=["documents", "distances", "metadatas"],
            )

            # Parse results
            relevant_chunks = []

            if results["documents"] and len(results["documents"]) > 0:
                for i, (doc, distance, metadata) in enumerate(
                    zip(
                        results["documents"][0],
                        results["distances"][0],
                        results["metadatas"][0],
                    )
                ):
                    # Convert distance to similarity (cosine: similarity = 1 - distance)
                    similarity = 1 - distance if config.vector_store.distance_metric == "cosine" else distance

                    if similarity >= similarity_threshold:
                        relevant_chunks.append(
                            {
                                "content": doc,
                                "similarity": similarity,
                                "rank": i + 1,
                                "source": metadata.get("source", "unknown"),
                                "chunk_index": metadata.get("chunk_index"),
                            }
                        )

            logger.info(f"Found {len(relevant_chunks)} relevant chunks for query")
            return relevant_chunks

        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []

    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks belonging to a document"""
        try:
            # Find all chunks of this document
            results = self.collection.get(where={"document_id": {"$eq": document_id}})

            if results["ids"]:
                self.collection.delete(ids=results["ids"])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
                return True
            else:
                logger.warning(f"No chunks found for document {document_id}")
                return False

        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            return False

    def get_collection_stats(self) -> Dict:
        """Get vector store statistics"""
        try:
            count = self.collection.count()

            # Get unique documents
            results = self.collection.get(include=["metadatas"])
            unique_docs = set()
            if results["metadatas"]:
                unique_docs = {meta.get("document_id") for meta in results["metadatas"]}

            return {
                "collection_name": self.collection_name,
                "total_chunks": count,
                "unique_documents": len(unique_docs),
                "embedding_model": config.embedding.model_name,
                "distance_metric": config.vector_store.distance_metric,
            }

        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {}

    def persist(self):
        """Persist vector store to disk"""
        try:
            self.client.persist()
            logger.info("✅ Vector store persisted")
        except Exception as e:
            logger.warning(f"Could not persist vector store: {e}")

    def clear_collection(self) -> bool:
        """Clear all data from collection (careful!)"""
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": config.vector_store.distance_metric},
            )
            logger.warning("⚠️  Collection cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing collection: {e}")
            return False


if __name__ == "__main__":
    # Test vector store
    vs = VectorStore()
    stats = vs.get_collection_stats()

    print("Vector Store Statistics:")
    for key, value in stats.items():
        print(f"  {key}: {value}")

    # Test search
    query = "What is quantitative aptitude?"
    results = vs.search(query, top_k=3)

    if results:
        print(f"\nSearch Results for: '{query}'")
        for i, result in enumerate(results, 1):
            print(f"\n{i}. (Similarity: {result['similarity']:.2%})")
            print(f"   {result['content'][:200]}...")
    else:
        print("No results found - vector store is empty")
