// * Shared kernel exports

// * Types
export * from './types/common.types';

// * Domain
export * from './domain/entities/base.entity';
export * from './domain/events/domain-event.base';
export * from './domain/specifications/specification.base';
export * from './domain/state-machine/state';
export * from './domain/state-machine/state-machine.base';
export * from './domain/state-machine/state-machine.error';
export * from './domain/state-machine/transition';
export * from './domain/value-objects/address.vo';
export * from './domain/value-objects/email.vo';
export * from './domain/value-objects/money.vo';
export * from './domain/value-objects/phone-number.vo';

// * Application
export * from './application/dto/pagination.dto';
export * from './application/dto/result.dto';
export * from './application/errors/application.error';
export * from './application/errors/conflict.error';
export * from './application/errors/forbidden.error';
export * from './application/errors/localized.error';
export * from './application/errors/not-found.error';
export * from './application/errors/unauthorized.error';
export * from './application/errors/validation.error';
