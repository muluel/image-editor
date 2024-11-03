from rest_framework import viewsets
from rest_framework.response import Response
from .models import Image
from .serializers import ImageSerializer


class ImageViewSet(viewsets.ModelViewSet):
    queryset = Image.objects.all()
    serializer_class = ImageSerializer

    def post(self, request, *args, **kwargs):
        name = request.data["name"]
        file = request.data["file"]
        Image.objects.create(name=name, image=file)
        return Response({"message": "Uploaded"}, status=201)
