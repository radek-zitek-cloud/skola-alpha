import logging
import csv
import os
from app.database import SessionLocal, engine, Base
from app.models import Vocabulary, WordAttempt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def populate_db():
    db = SessionLocal()
    try:
        # Delete all existing data
        logger.info("Deleting existing word attempts...")
        db.query(WordAttempt).delete()
        logger.info("Deleting existing vocabulary...")
        db.query(Vocabulary).delete()
        db.commit()

        # Read from CSV
        csv_path = os.path.join(os.path.dirname(__file__), "czech_english_vocabulary.csv")
        logger.info(f"Reading vocabulary from {csv_path}...")
        
        vocabulary_items = []
        with open(csv_path, mode='r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                vocab = Vocabulary(
                    czech=row['cz_word'],
                    english=row['en_word'],
                    category=row['category'],
                    level=str(row['level'])
                )
                vocabulary_items.append(vocab)

        logger.info(f"Adding {len(vocabulary_items)} vocabulary items...")
        db.add_all(vocabulary_items)
        db.commit()
        logger.info("Database populated successfully!")

    except Exception as e:
        logger.error(f"Error populating database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_db()
