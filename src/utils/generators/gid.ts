const GID_PREFIX = '999'
const GID_DELIMITER = '.'

const GID_REGEX = new RegExp(
  `^[0-9]{3,4}${GID_DELIMITER}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`,
)

const STATIC_UUID = '00000000-0000-0000-0000-000000000000'

const gid = (uuid?: string) => `${GID_PREFIX}${GID_DELIMITER}${uuid ?? crypto.randomUUID()}`
const isGid = (value: string) => GID_REGEX.test(value)
const exampleGid = (isRandom = false) => gid(isRandom ? crypto.randomUUID() : STATIC_UUID)

export { exampleGid, gid, isGid, GID_DELIMITER, GID_PREFIX }
