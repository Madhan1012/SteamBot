from typing import Tuple, List, Any
from app.schema.chat import DynamicEntities

class DynamicQueryBuilder:

    def __init__(self):
        self.selected_columns = [
            "appid",
            "name",
            "price",
            "user_score",
            "developers",
            "release_date"
        ]

    def build(self, entities: DynamicEntities) -> Tuple[str, List[Any]]:
        where_clauses: List[str] = []
        params: List[Any] = []

        if entities.title:
            where_clauses.append("LOWER(name) LIKE ?")
            params.append(f"%{entities.title.lower()}%")

        if entities.developer:
            where_clauses.append("LOWER(developers) LIKE ?")
            params.append(f"%{entities.developer.lower()}%")

        if entities.is_free:
            where_clauses.append("price = 0")
        else:
            if entities.price_max is not None and entities.price_min is not None:
                where_clauses.append("price BETWEEN ? AND ?")
                params.extend([entities.price_min, entities.price_max])
            elif entities.price_max is not None:
                where_clauses.append("price <= ?")
                params.append(entities.price_max)
            elif entities.price_min is not None:
                where_clauses.append("price >= ?")
                params.append(entities.price_min)
        
        if entities.year is not None:
            where_clauses.append("release_date LIKE ?")
            params.append(f"%{entities.year}%")
        
        # Ensure proper spacing around FROM games
        sql = f"SELECT {', '.join(self.selected_columns)} FROM games "
        
        if where_clauses:
            sql += "WHERE " + " AND ".join(where_clauses) + " "
        
        sort_col = entities.sort_by if entities.sort_by else "user_score"
        sort_order = entities.sort_order if entities.sort_order else "DESC"

        sql += f"ORDER BY {sort_col} {sort_order} LIMIT 15;"

        return sql, params