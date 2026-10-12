from django.shortcuts import render

from rest_framework import viewsets

from .models import Task
from .serializers import TaskSerializer


def home(request):
    return render(
        request,
        "tasks/index.html"
    )


class TaskViewSet(viewsets.ModelViewSet):

    queryset = Task.objects.all().order_by("-created_at")

    serializer_class = TaskSerializer
