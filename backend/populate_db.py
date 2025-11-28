import logging
from app.database import SessionLocal, engine, Base
from app.models import Vocabulary

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

VOCABULARY_DATA = [
    {"czech": "pes", "english": "dog"},
    {"czech": "kočka", "english": "cat"},
    {"czech": "auto", "english": "car"},
    {"czech": "dům", "english": "house"},
    {"czech": "škola", "english": "school"},
    {"czech": "jablko", "english": "apple"},
    {"czech": "strom", "english": "tree"},
    {"czech": "kniha", "english": "book"},
    {"czech": "slunce", "english": "sun"},
    {"czech": "měsíc", "english": "moon"},
    {"czech": "voda", "english": "water"},
    {"czech": "oheň", "english": "fire"},
    {"czech": "země", "english": "earth"},
    {"czech": "vzduch", "english": "air"},
    {"czech": "květina", "english": "flower"},
    {"czech": "tráva", "english": "grass"},
    {"czech": "nebe", "english": "sky"},
    {"czech": "mrak", "english": "cloud"},
    {"czech": "déšť", "english": "rain"},
    {"czech": "sníh", "english": "snow"},
    {"czech": "vítr", "english": "wind"},
    {"czech": "řeka", "english": "river"},
    {"czech": "moře", "english": "sea"},
    {"czech": "les", "english": "forest"},
    {"czech": "hora", "english": "mountain"},
    {"czech": "cesta", "english": "road"},
    {"czech": "město", "english": "city"},
    {"czech": "vesnice", "english": "village"},
    {"czech": "most", "english": "bridge"},
    {"czech": "hrad", "english": "castle"},
    {"czech": "král", "english": "king"},
    {"czech": "královna", "english": "queen"},
    {"czech": "princ", "english": "prince"},
    {"czech": "princezna", "english": "princess"},
    {"czech": "rytíř", "english": "knight"},
    {"czech": "drak", "english": "dragon"},
    {"czech": "kůň", "english": "horse"},
    {"czech": "kráva", "english": "cow"},
    {"czech": "prase", "english": "pig"},
    {"czech": "ovce", "english": "sheep"},
    {"czech": "slepice", "english": "hen"},
    {"czech": "kohout", "english": "rooster"},
    {"czech": "kachna", "english": "duck"},
    {"czech": "husa", "english": "goose"},
    {"czech": "myš", "english": "mouse"},
    {"czech": "pták", "english": "bird"},
    {"czech": "ryba", "english": "fish"},
    {"czech": "had", "english": "snake"},
    {"czech": "lev", "english": "lion"},
    {"czech": "tygr", "english": "tiger"},
    {"czech": "slon", "english": "elephant"},
    {"czech": "opice", "english": "monkey"},
    {"czech": "medvěd", "english": "bear"},
    {"czech": "vlk", "english": "wolf"},
    {"czech": "liška", "english": "fox"},
    {"czech": "zajíc", "english": "hare"},
    {"czech": "králík", "english": "rabbit"},
    {"czech": "veverka", "english": "squirrel"},
    {"czech": "ježek", "english": "hedgehog"},
    {"czech": "sova", "english": "owl"},
    {"czech": "orel", "english": "eagle"},
    {"czech": "holub", "english": "pigeon"},
    {"czech": "vrána", "english": "crow"},
    {"czech": "labuť", "english": "swan"},
    {"czech": "motýl", "english": "butterfly"},
    {"czech": "včela", "english": "bee"},
    {"czech": "mravenec", "english": "ant"},
    {"czech": "pavouk", "english": "spider"},
    {"czech": "hlava", "english": "head"},
    {"czech": "oko", "english": "eye"},
    {"czech": "ucho", "english": "ear"},
    {"czech": "nos", "english": "nose"},
    {"czech": "ústa", "english": "mouth"},
    {"czech": "zub", "english": "tooth"},
    {"czech": "jazyk", "english": "tongue"},
    {"czech": "ruka", "english": "hand"},
    {"czech": "noha", "english": "leg"},
    {"czech": "prst", "english": "finger"},
    {"czech": "vlasy", "english": "hair"},
    {"czech": "srdce", "english": "heart"},
    {"czech": "krev", "english": "blood"},
    {"czech": "kost", "english": "bone"},
    {"czech": "kůže", "english": "skin"},
    {"czech": "chléb", "english": "bread"},
    {"czech": "mléko", "english": "milk"},
    {"czech": "maso", "english": "meat"},
    {"czech": "vejce", "english": "egg"},
    {"czech": "sýr", "english": "cheese"},
    {"czech": "ovoce", "english": "fruit"},
    {"czech": "zelenina", "english": "vegetables"},
    {"czech": "brambory", "english": "potatoes"},
    {"czech": "rýže", "english": "rice"},
    {"czech": "těstoviny", "english": "pasta"},
    {"czech": "polévka", "english": "soup"},
    {"czech": "čaj", "english": "tea"},
    {"czech": "káva", "english": "coffee"},
    {"czech": "džus", "english": "juice"},
    {"czech": "pivo", "english": "beer"},
    {"czech": "víno", "english": "wine"},
]

def populate_db():
    db = SessionLocal()
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # Check if vocabulary is already populated
        count = db.query(Vocabulary).count()
        if count > 0:
            logger.info(f"Database already contains {count} vocabulary words. Skipping population.")
            return

        logger.info("Populating database with vocabulary words...")
        for item in VOCABULARY_DATA:
            word = Vocabulary(czech=item["czech"], english=item["english"])
            db.add(word)
        
        db.commit()
        logger.info("Database populated successfully!")
        
    except Exception as e:
        logger.error(f"Error populating database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_db()
