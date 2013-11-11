from django.conf import settings
from django.core.cache import cache, get_cache

CACHE_KEY_PREFIX = settings.FRONT_END['CACHE_KEY_PREFIX']

cache = get_cache('default')

def get_cache(key, default=None):
	if default is None:
		return cache.get(key)
	else:
		return cache.get(key, default)


def set_cache(key, val, timeout=86400):
	cache.set(key, val, timeout)

def clear_cache():
	cache.clear()