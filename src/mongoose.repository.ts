import { Repository } from './repository';
import { Optional } from 'typescript-optional';
import { HydratedDocument, Model, UpdateQuery } from 'mongoose';
import { Entity } from './util/entity';
import {
  IllegalArgumentException,
  NotFoundException,
  UndefinedConstructorException,
  UniquenessViolationException,
} from './util/exceptions';

type Constructor<T> = new (...args: any) => T;

interface ConstructorMap<T> {
  [index: string]: Constructor<T>;
}

export abstract class MongooseRepository<T extends Entity & UpdateQuery<T>>
  implements Repository<T>
{
  protected constructor(
    private readonly elementModel: Model<T>,
    private readonly elementConstructorMap: ConstructorMap<T>,
  ) {}

  async deleteById(id: string): Promise<boolean> {
    if (!id) throw new IllegalArgumentException('The given ID must be valid');
    const isDeleted = await this.elementModel.findByIdAndDelete(id);
    return !!isDeleted;
  }

  async findAll<S extends T>(): Promise<S[]> {
    return this.elementModel
      .find()
      .exec()
      .then((documents) =>
        documents.map((document) => this.instantiateFrom(document) as S),
      );
  }

  async findById<S extends T>(id: string): Promise<Optional<S>> {
    if (!id) throw new IllegalArgumentException('The given ID must be valid');
    return this.elementModel
      .findById(id)
      .exec()
      .then((document) =>
        Optional.ofNullable(this.instantiateFrom(document) as S),
      );
  }

  async save<S extends T>(
    element: S | ({ id: string } & Partial<S>),
  ): Promise<S> {
    if (!element)
      throw new IllegalArgumentException('The given element must be valid');
    let document;
    if (!element.id) {
      document = await this.insert(<S>element);
    } else {
      document = await this.update(<{ id: string } & Partial<S>>element);
    }
    if (document) return this.instantiateFrom(document) as S;
    throw new NotFoundException(
      `There is no document matching the given ID ${element.id}. New elements cannot not specify an ID`,
    );
  }

  protected instantiateFrom<S extends T>(
    document: HydratedDocument<T> | null,
  ): S | null {
    if (!document) return null;
    let discriminatorType = document.get('__t');
    discriminatorType = discriminatorType ?? 'Default';
    const elementConstructor = this.elementConstructorMap[discriminatorType];
    if (elementConstructor) {
      return new elementConstructor(document.toObject()) as S;
    }
    throw new UndefinedConstructorException(
      `There is no registered instance constructor for the document with ID ${document.id}`,
    );
  }

  private async insert<S extends T>(element: S): Promise<HydratedDocument<S>> {
    try {
      return (await this.elementModel.create(element)) as HydratedDocument<S>;
    } catch (error) {
      if (error.message.includes('duplicate key error')) {
        throw new UniquenessViolationException(
          `The given element with ID ${element.id} includes a field which value is expected to be unique`,
        );
      }
      throw error;
    }
  }

  private async update<S extends T>(
    element: { id: string } & Partial<S>,
  ): Promise<HydratedDocument<S> | null> {
    const document = await this.elementModel.findById<HydratedDocument<S>>(
      element.id,
    );
    if (document) {
      document.set(element);
      document.isNew = false;
      return (await document.save()) as HydratedDocument<S>;
    }
    return null;
  }
}
