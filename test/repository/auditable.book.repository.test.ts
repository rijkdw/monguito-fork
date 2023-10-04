import { Repository } from '../../src';
import { AuditableBook, AuditablePaperBook } from '../domain/auditable.book';
import {
  closeMongoConnection,
  deleteAll,
  setupConnection,
} from '../util/mongo-server';
import { AuditableMongooseBookRepository } from './auditable.book.repository';

describe('Given an instance of auditable book repository and a user ID', () => {
  let bookRepository: Repository<AuditableBook>;
  const createdBy = '1234';

  beforeAll(async () => {
    setupConnection();
    bookRepository = new AuditableMongooseBookRepository();
  });

  describe('when creating an auditable book', () => {
    describe('that is of supertype AuditableBook', () => {
      it('then the inserted book includes the expected audit data', async () => {
        const bookToInsert = new AuditableBook({
          title: 'Continuous Delivery',
          description:
            'Reliable Software Releases Through Build, Test, and Deployment Automation',
          isbn: '9780321601919',
        });

        const auditableBook = await bookRepository.save(
          bookToInsert,
          createdBy,
        );
        expect(auditableBook.createdAt).toBeDefined();
        expect(auditableBook.updatedAt).toBeDefined();
        expect(auditableBook.createdBy).toEqual(createdBy);
        expect(auditableBook.updatedBy).toEqual(createdBy);
      });
    });

    describe('that is of a subtype of AuditableBook', () => {
      it('then the inserted book includes the expected audit data', async () => {
        const bookToInsert = new AuditablePaperBook({
          title: 'Implementing Domain-Driven Design',
          description: 'Describes Domain-Driven Design in depth',
          edition: 1,
          isbn: '9780321834577',
        });

        const auditableBook = await bookRepository.save(
          bookToInsert,
          createdBy,
        );
        expect(auditableBook.createdAt).toBeDefined();
        expect(auditableBook.updatedAt).toBeDefined();
        expect(auditableBook.createdBy).toEqual(createdBy);
        expect(auditableBook.updatedBy).toEqual(createdBy);
      });
    });
  });

  describe('when updating an auditable book', () => {
    let storedAuditableBook: AuditableBook;
    const updatedBy = '5678';

    beforeEach(async () => {
      const auditableBook = new AuditableBook({
        title: 'The Phoenix Project',
        description:
          'Building and Scaling High Performing Technology Organizations',
        isbn: '1942788339',
      });
      storedAuditableBook = await bookRepository.save(auditableBook, createdBy);
    });

    describe('that is of supertype AuditableBook', () => {
      it('then the updated book includes the expected audit data', async () => {
        const bookToUpdate = {
          id: storedAuditableBook.id,
          description:
            'A Novel About IT, DevOps, and Helping Your Business Win',
        } as AuditableBook;

        const auditableBook = await bookRepository.save(bookToUpdate, '5678');
        expect(auditableBook.createdAt).toEqual(storedAuditableBook.createdAt);
        expect(auditableBook.updatedAt?.getTime()).toBeGreaterThan(
          storedAuditableBook.updatedAt!.getTime(),
        );
        expect(auditableBook.createdBy).toEqual(createdBy);
        expect(auditableBook.updatedBy).toEqual(updatedBy);
      });
    });

    describe('that is of a subtype of AuditableBook', () => {
      let storedAuditablePaperBook: AuditablePaperBook;

      beforeEach(async () => {
        const auditablePaperBook = new AuditablePaperBook({
          title: 'Effective Java',
          description: 'Great book on the Java programming language',
          edition: 3,
          isbn: '0134685997',
        });

        storedAuditablePaperBook = await bookRepository.save(
          auditablePaperBook,
          createdBy,
        );
      });

      it('then the updated book includes the expected audit data', async () => {
        const bookToUpdate = {
          id: storedAuditablePaperBook.id,
          edition: 4,
        } as AuditablePaperBook;

        const auditablePaperBook = await bookRepository.save(
          bookToUpdate,
          updatedBy,
        );
        expect(auditablePaperBook.createdAt).toEqual(
          storedAuditablePaperBook.createdAt,
        );
        expect(auditablePaperBook.updatedAt?.getTime()).toBeGreaterThan(
          storedAuditablePaperBook.updatedAt!.getTime(),
        );
        expect(auditablePaperBook.createdBy).toEqual(createdBy);
        expect(auditablePaperBook.updatedBy).toEqual(updatedBy);
      });
    });
  });

  afterEach(async () => {
    await deleteAll('auditablebooks');
  });

  afterAll(async () => {
    await closeMongoConnection();
  });
});
