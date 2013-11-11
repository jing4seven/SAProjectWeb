import hmac
import random
import hashlib
import base64
from django.conf import settings

def gen_random_key(bit = 128):
	'''
	Generate a hash key.

	bit = 128, 256
	'''
	random_str = str(random.getrandbits(128))
	key = base64.b64encode(hashlib.sha256(random_str).digest(), random.choice(generate_radom_list())).rstrip('==')
	return key

def gen_random_key_by_given_key(g_key):
	'''
	Generate a hash key by a given key.
	'''
	if not g_key or len(g_key) == 0:
		return None

	security_key = base64.b64encode(g_key, random.choice(generate_radom_list())).rstrip('==')
	return security_key

def generate_radom_list(length=2, count=6):
	'''
	Generate a random list by condition.

	condition: length=2, count=6
	return:
	['aE', 'bc', '5w', 'wc', 'ew', 'ac']
	'''
	basic_str = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	arr = []
	i=0
	while i<count:	
		word = ''
		j=0
		while j < length:
			word += random.choice(basic_str)
			j=j+1
		arr.append(word)
		i=i+1

	return arr

def gen_password(vis_pwd, salt=None):
	salt = salt or settings.SECRET_KEY
	print salt
	return hmac.new(salt, vis_pwd, hashlib.sha1).hexdigest()


def gen_hash_key(value, length=None):
	hash = hashlib.sha1()
	hash.update(value)
	if length is not None:
		return hash.hexdigest()[:length]
	else:
		return hash.hexdigest()
