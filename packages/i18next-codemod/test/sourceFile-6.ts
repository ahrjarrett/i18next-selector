import * as i18next from './dummy-t.js'

i18next.t('abc.def.ghi')

i18next.t('ns1:abc.def.ghi')

i18next.t('bob:abc.def.ghi')

i18next.t('abc.def.ghi', 'default value')

i18next.t('abc.def.ghi', 'default value', { ns: 'ns1' })

i18next.t('ns1:abc.def.ghi', 'default value', { val: 'some val' })
