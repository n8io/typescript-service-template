# NPM Best Practices

It is very important that any and all `npm` commands need to be ran with the proper NodeJs version. This means that we should run `nvm install` at least once per shell session, before running any `npm` commands.

## Example

When you run:

```bash
npm install
```

The rule will first execute:

```bash
nvm install
```

Then proceed with your `npm` command.
