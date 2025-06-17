import { t } from './dummy-t.js'

t('abc.def.ghi')

t('ns1:abc.def.ghi')

t('bob:abc.def.ghi')

t('abc.def.ghi', 'default value')

t('abc.def.ghi', 'default value', { ns: 'ns1' })

t('ns1:abc.def.ghi', 'default value', { val: 'some val' })
