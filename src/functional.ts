module dcAG.functionalTS.functional {
    interface Functor<T> {
        map<U>(f: (t:T) => U): Functor<U>
    }

    interface Applicative<T> extends Functor<T> {
        pure(t:T): Applicative<T>
        apply<U>(f: Applicative<(t:T) => U>): Applicative<U>
        map<U>(f: (t:T) => U): Applicative<U>
    }

    interface Monad<T> extends Applicative<T> {
        pure(t:T): Monad<T>
        apply<U>(f: Monad<(t:T) => U>): Monad<U>
        map<U>(f: (t:T) => U): Monad<U>
        flatMap<U>(f: (t:T) => Monad<U>): Monad<U> 
    }
}