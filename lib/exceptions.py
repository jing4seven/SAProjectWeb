class ResourceNotFound(IOError, LookupError):
    """Raised if a resource does not exist."""
    message = None

    def __init__(self, name, message=None):
        IOError.__init__(self)
        if message is None:
            message = name
        self.message = message
        self.name = name
        self.resources = [name]

    def __str__(self):
        return self.message