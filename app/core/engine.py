from app.core.extractor import AdvancedEntityExtractor
from app.core.query_builider import DynamicQueryBuilder
from app.db.database import execute_query
from app.schema.chat import ChatRequest, ChatResponse

class AegisEngine:

    def __init__(self):

        self.extractor = AdvancedEntityExtractor()
        self.builder = DynamicQueryBuilder()

    def process_message(self, request : ChatRequest) -> ChatResponse:

        try:
            entities = self.extractor.extract(request.message)
            sql, params = self.builder.build(entities)
            db_results = execute_query(sql, params)

            return ChatResponse(
                extracted_entities = entities,
                sql_query = sql,
                results = db_results,
                error = None
            )
        
        except Exception as e:

            return ChatResponse(
                extracted_entities = None,
                sql_query = "",
                results = [],
                error = str(e)
            )
