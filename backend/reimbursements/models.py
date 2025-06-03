from django.db import models
from django.core.validators import FileExtensionValidator
from django.contrib.auth.models import User

class FundingGroup(models.Model):
    name = models.CharField(max_length=200)
    date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.date})"

    def total_expenses(self):
        return sum(item.amount for item in self.items.all())

    def total_income(self):
        return sum(entry.amount for entry in self.income_entries.all())

    def balance(self):
        return self.total_income() - self.total_expenses()

class Application(models.Model):
    STATUS_CHOICES = [
        ('ausgezahlt', 'ausgezahlt'),
        ('genehmigt', 'genehmigt'),
        ('abgelehnt', 'abgelehnt'),
        ('entscheidung_ausstehend', 'Entscheidung ausstehen'),
    ]

    applicant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='applications')
    iban = models.CharField(max_length=34)
    account_holder = models.CharField(max_length=100)
    comment = models.TextField()
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='entscheidung_ausstehend')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.applicant.username} – {self.total_amount()} € – {self.get_status_display()}"

    def total_amount(self):
        return sum(item.amount for item in self.items.all())

class BudgetEntry(models.Model):
    funding_group = models.ForeignKey(FundingGroup, on_delete=models.CASCADE, related_name='budgets')
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.category}: {self.amount} €"

class ApplicationItem(models.Model):
    application = models.ForeignKey(Application, related_name='items', on_delete=models.CASCADE)
    position_number = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    budget_entry = models.ForeignKey(BudgetEntry, null=True, blank=True, on_delete=models.SET_NULL)
    receipt_file = models.FileField(
        upload_to='receipts/',
        null=True,
        blank=True,
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'jpg', 'jpeg', 'png'])]
    )
    funding_group = models.ForeignKey(
        FundingGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )

    def __str__(self):
        return f"{self.position_number}: {self.description} – {self.amount} €"

class IncomeEntry(models.Model):
    funding_group = models.ForeignKey(FundingGroup, on_delete=models.CASCADE, related_name='income_entries')
    source = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    received_at = models.DateField(null=True, blank=True)
    comment = models.TextField(blank=True)

    def __str__(self):
        return f"{self.source}: +{self.amount} €"

class CashExpenseEntry(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    booking_date = models.DateField()

    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='expense_entries', null=True, blank=True)
    funding_group = models.ForeignKey(FundingGroup, on_delete=models.SET_NULL, null=True, blank=True)

    balance_before = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    comment = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['booking_date', 'id']

    def __str__(self):
        return f"{self.booking_date} – Ausgabe – {self.amount} € – {self.comment}"


class CashIncomeEntry(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    booking_date = models.DateField()
    
    income_entry = models.ForeignKey(IncomeEntry, on_delete=models.CASCADE, related_name='cash_income_entries')
    funding_group = models.ForeignKey(FundingGroup, on_delete=models.SET_NULL, null=True, blank=True)

    balance_before = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    comment = models.CharField(max_length=255)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['booking_date', 'id']

    def __str__(self):
        return f"{self.booking_date} – Einnahme – {self.amount} € – {self.comment}"
