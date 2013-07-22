from django import template
from django.template import Library
from django.template.base import Node, TemplateSyntaxError
#from django.utils.html import format_html, mark_safe

register = Library()

class WidgetNode(Node):
    def __init__(self, widget_id, access_uri):
        self.widget_id = widget_id
        self.access_uri = access_uri
 
    def render(self, context):
        t = template.loader.get_template('templatetags/widget_container.html')
        
        if self.widget_id in context:
            self.widget_id = context[self.widget_id]

        if self.access_uri in context:
            self.access_uri = context[self.access_uri]
            
        context.update({'widget_id': self.widget_id, 'access_uri': self.access_uri})        
        return t.render(context)

@register.tag
def widget(parser, token):    
    bits = token.split_contents()[1:]
    if len(bits) != 2:
        raise TemplateSyntaxError("'%s' takes two argument"
                                  " (path to a view)" % bits[0])
    widget_id = bits[0]
    access_uri = bits[1]
    #nodelist = parser.parse(('endwidget',))
    #parser.delete_first_token()
    return WidgetNode(widget_id, access_uri)