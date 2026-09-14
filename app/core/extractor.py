import re
from app.schema.chat import DynamicEntities

class AdvancedEntityExtractor:

    def extract(self, message: str) -> DynamicEntities:
        
        msg_lower = message.lower()
        entities = DynamicEntities()

        if "free" in msg_lower:
            entities.is_free = True 
        else:
            max_price_match = re.search(r'(?:under|below|less than|\<=?)\s*\$?(\d+(?:\.\d{1,2})?)', msg_lower)
            if max_price_match:
                entities.price_max = float(max_price_match.group(1))
            
            min_price_match = re.search(r'(?:over|above|more than|\>=?)\s*\$?(\d+(?:\.\d{1,2})?)', msg_lower)
            if min_price_match:
                entities.price_min = float(min_price_match.group(1))

        year_match = re.search(r'(\b(19\d\d|20[0-2]\d)\b)', msg_lower)
        if year_match:
            entities.year = int(year_match.group(1))
        
        
        dev_pattern = (
            r"(?:\bby\b|\bdeveloper is\b|\bpublished by\b|\bpublisher\b|\bfrom\b|\bdev\b|\bmade by\b)"
            r"\s+(?!\d{4}\b)([\w\s.-]+?)(?=\s+\b(?:under|over|in|released|top|best|for|with|least|most|cheap)\b|$)"
        )

        dev_match = re.search(dev_pattern, msg_lower, re.IGNORECASE)
        if dev_match:
            entities.developer = dev_match.group(1).strip()
        
        if any(term in msg_lower for term in ["cheapest", "lowest price", "inexpensive", "cheap", "least expensive"]):
            entities.sort_by = "price"
            entities.sort_order = "ASC"
        elif any(term in msg_lower for term in ["most expensive", "highest price", "pricey", "over priced"]):
            entities.sort_by = "price"
            entities.sort_order = "DESC"
        elif any(term in msg_lower for term in ["top rated", "best", "highest rated", "top", "popular"]):
            entities.sort_by = "user_score"
            entities.sort_order = "DESC"
        elif any(term in msg_lower for term in ["newest", "just released", "latest", "recent"]):
            entities.sort_by = "release_date"
            entities.sort_order = "DESC"
        
        return entities
