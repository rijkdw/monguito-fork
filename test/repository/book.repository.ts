import {
  IllegalArgumentException,
  MongooseRepository,
  Repository,
} from '../../src';
import { Optional } from 'typescript-optional';
import { AudioBook, Book, PaperBook } from '../domain/book';
import { AudioBookSchema, BookSchema, PaperBookSchema } from './book.schema';

export interface BookRepository extends Repository<Book> {
  findByIsbn: <T extends Book>(isbn: string) => Promise<Optional<T>>;
}

export class MongooseBookRepository
  extends MongooseRepository<Book>
  implements BookRepository
{
  constructor() {
    super({
      Default: { type: Book, schema: BookSchema },
      PaperBook: { type: PaperBook, schema: PaperBookSchema },
      AudioBook: { type: AudioBook, schema: AudioBookSchema },
    });
  }

  async findByIsbn<T extends Book>(isbn: string): Promise<Optional<T>> {
    if (!isbn)
      throw new IllegalArgumentException('The given ISBN must be valid');
    const book = await this.entityModel.findOne({ isbn: isbn }).exec();
    return Optional.ofNullable<T>(this.instantiateFrom(book) as unknown as T);
  }
}

export class MongooseBookRepositoryWithoutBaseClass
  extends MongooseRepository<Book>
  implements BookRepository
{
  constructor() {
    super(
      {
        Default: { schema: BookSchema },
        PaperBook: { type: PaperBook, schema: PaperBookSchema },
        AudioBook: { type: AudioBook, schema: AudioBookSchema },
      },
      { collectionName: 'myBooks', modelName: 'book' },
    );
  }

  async findByIsbn<T extends Book>(isbn: string): Promise<Optional<T>> {
    if (!isbn)
      throw new IllegalArgumentException('The given ISBN must be valid');
    const book = await this.entityModel.findOne({ isbn: isbn }).exec();
    return Optional.ofNullable<T>(this.instantiateFrom(book) as unknown as T);
  }
}
