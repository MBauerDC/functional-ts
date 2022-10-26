import { Functor, Applicative, Monad } from "./functional.ts";

module dcAG.functionalTS.monads {

    // MAYBE - for optional values

    interface Maybe<T> extends Monad<T> {
        getOrElse(t: T): T
        getOrError(): T
        map<U>(f: (t: T) => U): Maybe<U>
    }
    
    class Just<T> implements Maybe<T> {
        private inner: T
        constructor(inner: T) {
            this.inner = inner
        }
        map<U>(f: (t:T) => U): Just<U> { return new Just(f(this.inner)) }
        pure(t: T): Just<T> { return  new Just(t) }
        apply<U>(f: Maybe<(t:T) => U>): Maybe<U> { return f.map((g => g(this.inner))) }
        flatMap<U>(f: (t:T) => Maybe<U>): Maybe<U> { return f(this.inner) }
        getOrElse(t: T): T { return this.inner }
        getOrError(): T { return this.inner }
    }
    
    function just<T>(t: T): Just<T> { return new Just(t) }
    
    class None implements Maybe<any> {
        map<U>(f: (t:any) => U): None { return this }
        pure<T>(t: T): Just<T> { return  new Just(t) }
        apply<T, U>(f: Maybe<(t:T) => U>): Maybe<U> { return this }
        flatMap<T, U>(f: (t:T) => Maybe<U>): Maybe<U> { return this }
        getOrElse<T>(t: T): T { return t }
        getOrError<T>(): T { throw new Error("get fails on Maybe which is None.") }
    }
    
    function none(): None { return new None }
    

    // EITHER - for sum types or representations of failure (left) or success (right) of a computation

    interface Either<Left, Right> extends Monad<Right> {
        rightOrElse(r: Right): Right
        map<U>(f: (t:Right) => U): Either<any, U>
        pure<T>(t: T): Either<any, T>
    }
    
    class Left<T> implements Either<T, any> {
        private inner: T
        constructor(inner: T) {
            this.inner = inner
        }
        rightOrElse<Right>(r: Right) { return r }
        map<Right, U>(f: (t:Right) => U): Either<any, U> { return this }
        pure<U>(t: U): Either<any, U> { return  new Right(t) }
        apply<Right, U>(f: Either<any, (t:Right) => U>): Either<any, U> { return this}
        flatMap<Right, U>(f: (t:Right) => Either<any, U>): Either<any, U> { return this }
    }
    
    function left<T, R>(t: T): Left<T> { return new Left(t) }
    
    class Right<T> implements Either<any, T> {
        private inner: T
        constructor(inner: T) {
            this.inner = inner
        }
        rightOrElse(r: T) { return this.inner }
        map<U>(f: (t:T) => U): Either<any, U> { return new Right(f(this.inner)) }
        pure<U>(t: U): Either<any, U> { return  new Right(t) }
        apply<U>(f: Either<any, (t:T) => U>): Either<any, U> { return f.map(g => g(this.inner))}
        flatMap<U>(f: (t:T) => Either<any, U>): Either<any, U> { return f(this.inner) }
    }
    
    function right<L, T>(t: T): Right<T> { return new Right(t) }
    

    // READER - for "dependency-injection" Methods Requiring P from an environment E can return a Reader<E, P>

    class Reader<E, P> implements Monad<P> {
        private projector: (e: E) => P
        constructor(p: (e: E) => P) { this.projector = p }
        
        map<P2>(f: (p:P) => P2): Reader<E, P2> { return new Reader((e:E) => f(this.projector(e))) }
        pure<Q>(q: Q): Reader<any, Q> { return new Reader(_ => q) }
        apply<Q>(r: Reader<E, (p:P) => Q>): Reader<E, Q>  { 
            return new Reader(
              (e: E) => 
                r.run(e)(this.projector(e))
            ) 
        }
        flatMap<Q>(f: (p:P) => Reader<E, Q>): Reader<E, Q> {
            return new Reader(
                (e: E) => 
                  f(this.projector(e)).run(e)
            )
        }
        ask(e: E) { return e }
        run(e:E): P { return this.projector(e) }
    }
    
    function reader<E, P>(p: (e:E) => P): Reader<E, P> { return new Reader(p) }
    
}