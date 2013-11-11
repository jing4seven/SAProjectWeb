import os
import inspect
import logging

from datetime import datetime
from django.conf import settings
from cssmin import cssmin
from slimit import minify

from .hashtools import gen_hash_key
from .utils import set_cache, get_cache
from .exceptions import ResourceNotFound


ALL_STATIC_FILES = 'all_static_files'

def list_dir(path):
    directories, files = [], []
    for entry in os.listdir(path):
        if os.path.isdir(os.path.join(path, entry)):
            directories.append(os.path.join(path, entry))
        else:
            files.append(os.path.join(path, entry))
    return directories, files

def list_files(paths):
    subdirectories = []
    files = []
    for path in paths:
        subdirectories, files = list_dir(path)
        for subdirectory in subdirectories:
            files.extend(list_files((subdirectory,)))

    return files

def _make_hash_file(files, root):
    salt_key = []
    extension = ""
    for resource_file in files:      
        extension = os.path.splitext(resource_file)[1].lstrip(".") 
        salt_key.append(resource_file)
        salt_key.append(datetime.fromtimestamp(os.path.getmtime(resource_file)).strftime("%Y/%m/%d %H:%M"))
    # this key should be almost unique 
    hashed_key = gen_hash_key(":".join(salt_key), 8)
    hashed_file = "%s.%s" % (hashed_key, extension)
    hashed_full_file_name =  os.path.join(root, hashed_file)

    with open(hashed_full_file_name, "w+") as file_write:
        for resource_file in files:
            file_write.write("%s/* %s last modification in %s */%s" % 
                (os.linesep, 
                 os.path.basename(resource_file), 
                 datetime.fromtimestamp(os.path.getmtime(resource_file)).strftime("%Y/%m/%d %H:%M"), 
                 os.linesep))

            with open(resource_file, "r") as file_read:
                file_write.write(file_read.read())
                file_read.close()

        file_write.close()
    return hashed_file


def get_all_static_files():
    return get_cache(ALL_STATIC_FILES, [])

if get_cache(ALL_STATIC_FILES) is None:
    set_cache(ALL_STATIC_FILES, list_files(settings.STATICFILES_DIRS))


class Resource(object):
    def __init__(self, resource_finders=None):
        self._resources = []
        self._tag_string = None
        self._static_file_path = settings.STATIC_ROOT
        self._resource_finders = resource_finders

    def push(self, path):
        # retrive from static root path first
        for abs_path in get_cache(ALL_STATIC_FILES):
            if abs_path.endswith(path):
                self._resources.append(abs_path)
                return ""

        # retrive from the package
        if self._resource_finders is not None:
            for res_finder in self._resource_finders:
                try:
                    find_abs_path = res_finder.find(path)
                    # send it back to cache
                    set_cache(ALL_STATIC_FILES, get_cache(ALL_STATIC_FILES).append(find_abs_path))
                except:
                    # loop to other finder
                    continue

        return ""

    def _compress(self, *args):
        pass

    def render(self):
        '''
            we compress the resources and put it into STATIC_ROOT, 
            which means the user only access to the folder under STATIC_ROOT,
            and the source files store in STATICFILES_DIRS 
        '''        
        filename = _make_hash_file(self._resources, self._static_file_path)

        if settings.FRONT_END['ENVIRONMENT'] == 'development':
            self._compress(filename)

        return self._tag_string % ("%s%s/%s" % (settings.STATIC_URL, self._static_file_subpath, filename))

class JavascriptResource(Resource):

    def __init__(self, resource_finders=None):
        Resource.__init__(self, resource_finders)
        self._tag_string = '<script type="text/javascript" src="%s"></script>'
        self._static_file_subpath = "js"
        self._static_file_path = os.path.join(self._static_file_path, self._static_file_subpath)

    def compress(self, *args):
        # TODO
        pass

class CSSResource(Resource):

    def __init__(self, resource_finders=None):
        Resource.__init__(self, resource_finders)
        self._tag_string = '<link rel="stylesheet" type="text/css" href="%s" />'
        self._static_file_subpath = "css"
        self._static_file_path = os.path.join(self._static_file_path, self._static_file_subpath)

    def compress(self, *args):
        #TODO
        pass


class ResourceFinder(object):
    def find(self, resource_name):
        pass

class ResourcePackageFinder(ResourceFinder):
    def __init__(self, package_name, package_path='static',
                 encoding='utf-8'):
        from pkg_resources import DefaultProvider, ResourceManager, \
                                  get_provider
        provider = get_provider(package_name)
        self.encoding = encoding
        self.manager = ResourceManager()
        self.filesystem_bound = isinstance(provider, DefaultProvider)
        self.provider = provider
        self.package_path = package_path
        
    def find(self, resource_name):
        pieces = resource_name.split("/")
        p = '/'.join((self.package_path,) + tuple(pieces))
        if not self.provider.has_resource(p):
            raise ResourceNotFound(resource_name)

        filename = None
        if self.filesystem_bound:
            filename = self.provider.get_resource_filename(self.manager, p)            
        return filename


