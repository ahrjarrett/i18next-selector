import { t } from 'i18next'

t('abc.def.ghi')

t('ns1:abc.def.ghi')

t('bob:abc.def.ghi')

t('abc.def.ghi', 'default value')

t('abc.def.ghi', 'default value', { ns: 'ns1' })

t('ns1:abc.def.ghi', 'default value', { val: 'some val' })
