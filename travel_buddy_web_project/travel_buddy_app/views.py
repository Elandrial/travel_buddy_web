from django.http import HttpResponse
from django.shortcuts import render
from django.template import loader
from django.views.decorators.clickjacking import xframe_options_exempt


def index(request):
    template = loader.get_template("index.html")
    return HttpResponse(template.render({}, request))


@xframe_options_exempt
def lexbot(request):
    template = loader.get_template("lexbot.html")
    return HttpResponse(template.render({}, request))
