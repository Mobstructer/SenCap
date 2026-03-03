name = input("What is your name? ")

print("Hello, " + name + "!")

age = int(input("How old are you? "))
if age < 18:
    print("You are a minor.")
elif age < 65:
    print("You are an adult.")
else:
    print("You are a senior.")

print(name[0])
print(name[1])

colors = ["red", "green", "blue", "yellow", "purple"]
print("Here are some colors:" + str(colors))
colors.append(input("Add a color to the list: "))

colors.sort()
print("Here are the sorted colors:" + str(colors))