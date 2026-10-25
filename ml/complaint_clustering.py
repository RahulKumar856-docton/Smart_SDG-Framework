import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_distances

class ComplaintClusteringEngine:
    def __init__(self, eps=0.4, min_samples=2):
        """
        eps: The maximum distance between two samples for one to be considered as in the neighborhood of the other.
             Using cosine distance, eps=0.4 means a cosine similarity of at least 0.6 is required.
        """
        self.eps = eps
        self.min_samples = min_samples
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=1000, ngram_range=(1, 2))

    def cluster_complaints(self, complaints):
        """
        complaints: list of dicts. Expected keys: 'id', 'title', 'description', 'location', 'ward', 'category'
        Returns a list of clusters, where each cluster is a list of complaint IDs.
        Singletons (noise/outliers) are ignored or returned as separate single-item lists based on preference.
        """
        if not complaints or len(complaints) < self.min_samples:
            return []

        # Prepare corpus: combine text fields to capture semantic similarity
        corpus = []
        for c in complaints:
            title = c.get('title', '') or ''
            desc = c.get('description', '') or ''
            cat = c.get('category', '') or ''
            loc = c.get('location', '') or ''
            ward = c.get('ward', '') or ''
            # Heavily weight location and category to ensure geographic and topical relevance
            text = f"{title} {desc} {cat} {cat} {loc} {ward} {ward}"
            corpus.append(text)

        # TF-IDF
        try:
            X = self.vectorizer.fit_transform(corpus)
        except ValueError:
            # E.g., if corpus only contains stop words
            return []

        # Calculate Cosine Distance Matrix
        # DBSCAN does not natively support sparse matrices for 'cosine' metric easily in all sklearn versions without precomputing
        dist_matrix = cosine_distances(X)

        # DBSCAN Clustering
        db = DBSCAN(eps=self.eps, min_samples=self.min_samples, metric='precomputed')
        labels = db.fit_predict(dist_matrix)

        # Group by label
        clusters = {}
        for idx, label in enumerate(labels):
            if label == -1:
                # -1 means noise (no cluster)
                continue
            
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(complaints[idx])

        # Format output
        result = []
        for label, items in clusters.items():
            # Generate a cluster summary/keywords
            cluster_text = " ".join([c.get('title', '') for c in items])
            try:
                # Extract top 3 keywords from cluster
                vec = TfidfVectorizer(stop_words='english', max_features=3)
                vec.fit([cluster_text])
                keywords = list(vec.vocabulary_.keys())
            except Exception:
                keywords = [items[0].get('category', 'Unknown')]

            result.append({
                'cluster_id': f"C-{label+1}",
                'size': len(items),
                'keywords': keywords,
                'complaints': items
            })

        # Sort by size descending
        result.sort(key=lambda x: x['size'], reverse=True)
        return result
