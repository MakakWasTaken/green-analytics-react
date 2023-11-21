# Green Analytics JS

Green Analytics javascript framework for working with the [Green Analytics Project](https://green-analytics.com).

This framework has two main methods `logEvent` and `setPerson`.

## Installation

```bash
yarn add green-analytics-js
# or
npm i --save green-analytics-js
```

## Documentation

### Get Started

To get started with this framework, you will need an account on the [Green Analytics Website](https://green-analytics.com/dashboard)

Once you have the framework installed and you have an account you can initialize this framework.

```typescript
initGA('<api-token>')
```

To get your `api-token` you have to go to the [following page](https://green-analytics.com/settings?tab=Website), while being signed in.

### Methods

The `logEvent` method is made to accept various information. It takes the type of event and the event properties.
It also accepts `userProperties`, which will be connected to the user. This can be information like the u

```typescript
logEvent(
  event: {
    name: string
    type: string
    website?: {
      url: string
    }
    properties?: { [key: string]: any }
  }, 
  userProperties?: {[key:string]: any}
)
```

The `setPerson` method is used to determine what user is performing the following events that will be logged.

```typescript
setPerson({
  id: string
  name?: string
  email?: string
  properties?: { [key: string]: any }
})
```

## Constributing

This framework was built using typescript and yarn as the package manager.
In addition to this the project uses biome.js to lint, and uses commitlint to lint commit messages.

The recommended IDE for developing in this project is VSCode as it supports both biome.js & commitlint as extensions. It is however still possible to use all other IDEs as the project relies on CLI to check on commit.
