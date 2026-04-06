from sentence_transformers import SentenceTransformer

class ModelManager:
    """Shared singleton to manage the loading and access of the Sentence Transformer model."""
    _instance = None
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            print("Loading shared SentenceTransformer ('all-MiniLM-L6-v2')...")
            cls._model = SentenceTransformer('all-MiniLM-L6-v2')
        return cls._model

# Create a singleton function for easy access
def get_shared_model():
    return ModelManager.get_model()
